/**
 * POST /users/:userId/status
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me'のみ）
 *
 * Request Body:
 * {
 *   started_at: string;
 *   is_auto_detected: boolean;
 *   gym_pub_id?: string;
 *   partners?: Array<{
 *     pub_id: string;
 *   }>;
 * }
 *
 * Response:
 * {
 *   pub_id: string;
 *   started_at: string;
 *   is_auto_detected: boolean;
 *   gym_pub_id?: string;
 *   partners: Array<{
 *     pub_id: string;
 *   }>;
 * }
 */

import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorUnauthorized, ApiErrorInternalServerError, ApiErrorNotFound, FatalErrorHandler } from '@/src/api_old/_cmn/error';
import { UserSpecificId } from '../_mw/userid_resolve';
import { verifyUserAuthnFn } from '@/src/api_old/_mw/verify_user_authn';
import { nanoid } from 'nanoid';

export default async function post(c: Context) {
    // 認証チェック
    const result = await verifyUserAuthnFn(c);
    if (result instanceof Response) {
        return result;
    }

    const userSpecificId = c.get('userSpecificId') as UserSpecificId | undefined;
    if (!userSpecificId || !userSpecificId.isSelf) {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    const userAuthnInfo = c.get('userAuthnInfo');
    if (!userAuthnInfo) {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    const spClSess = c.get('supabaseClientSess');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    // リクエストボディの検証
    let body;
    try {
        body = await c.req.json();
    } catch {
        return new ApiErrorBadRequest("Invalid JSON").into_resp(c);
    }

    if (!body.started_at || typeof body.started_at !== 'string') {
        return new ApiErrorBadRequest("started_at is required and must be a string").into_resp(c);
    }

    if (typeof body.is_auto_detected !== 'boolean') {
        return new ApiErrorBadRequest("is_auto_detected is required and must be a boolean").into_resp(c);
    }

    // ユーザー情報取得
    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('in_spbs_id', userAuthnInfo.userObj.id)
        .single();

    if (userError || !userData) {
        return new ApiErrorNotFound('User').into_resp(c);
    }

    const userRelId = userData.rel_id;

    // ジム情報確認（指定されている場合）
    let gymRelId = null;
    if (body.gym_pub_id) {
        const { data: gymData, error: gymError } = await spClSess
            .from('gyms_master')
            .select('rel_id')
            .eq('pub_id', body.gym_pub_id)
            .single();

        if (gymError || !gymData) {
            return new ApiErrorNotFound('Gym').into_resp(c);
        }
        gymRelId = gymData.rel_id;
    }

    // パートナー情報確認（指定されている場合）
    const partnerRelIds = [];
    if (body.partners && Array.isArray(body.partners)) {
        for (const partner of body.partners) {
            if (!partner.pub_id) {
                return new ApiErrorBadRequest("Partner pub_id is required").into_resp(c);
            }

            const { data: partnerData, error: partnerError } = await spClSess
                .from('users_master')
                .select('rel_id')
                .eq('pub_id', partner.pub_id)
                .single();

            if (partnerError || !partnerData) {
                return new ApiErrorNotFound('Partner user').into_resp(c);
            }
            partnerRelIds.push(partnerData.rel_id);
        }
    }

    // 現在進行中のステータスがないかチェック
    const { data: existingStatus, error: existingError } = await spClSess
        .from('status_master')
        .select('pub_id')
        .eq('user_rel_id', userRelId)
        .is('finished_at', null)
        .single();

    if (existingError && existingError.code !== 'PGRST116') {
        await FatalErrorHandler(c, existingError, "checking existing status");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (existingStatus) {
        return new ApiErrorBadRequest("User already has an active training session").into_resp(c);
    }

    // ステータスマスター挿入
    const statusPubId = nanoid(21);
    const { data: statusData, error: statusError } = await spClSess
        .from('status_master')
        .insert({
            pub_id: statusPubId,
            user_rel_id: userRelId,
            started_at: body.started_at,
            is_auto_detected: body.is_auto_detected,
            gym_rel_id: gymRelId
        })
        .select('rel_id')
        .single();

    if (statusError || !statusData) {
        await FatalErrorHandler(c, statusError, "inserting status");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const statusRelId = statusData.rel_id;

    // パートナー挿入
    if (partnerRelIds.length > 0) {
        const partnerInserts = partnerRelIds.map(partnerRelId => ({
            status_rel_id: statusRelId,
            partner_user_rel_id: partnerRelId
        }));

        const { error: partnerError } = await spClSess
            .from('status_lines_partners')
            .insert(partnerInserts);

        if (partnerError) {
            await FatalErrorHandler(c, partnerError, "inserting partners");
            return new ApiErrorInternalServerError().into_resp(c);
        }
    }

    const response = {
        pub_id: statusPubId,
        started_at: body.started_at,
        is_auto_detected: body.is_auto_detected,
        gym_pub_id: body.gym_pub_id || null,
        partners: body.partners || []
    };

    return c.json(response);
}
