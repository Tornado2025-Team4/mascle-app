/**
 * DELETE /users/:userId/status/:stateId
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me'のみ）
 * - stateId: string - ステータスID（pub_idまたは'latest'）
 *
 * Response:
 * {
 *   pub_id: string;
 *   deleted: boolean;
 * }
 */

import { Context } from 'hono';
import { ApiErrorUnauthorized, ApiErrorInternalServerError, ApiErrorNotFound, FatalErrorHandler } from '@/src/api_old/_cmn/error';
import { UserSpecificId } from '../../_mw/userid_resolve';
import { verifyUserAuthnFn } from '@/src/api_old/_mw/verify_user_authn';

export default async function deleteHandler(c: Context) {
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

    const stateId = c.req.param('stateId');
    if (!stateId) {
        return new ApiErrorNotFound('State').into_resp(c);
    }

    const spClSess = c.get('supabaseClientSess');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
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

    // ステータス情報取得・権限確認
    let statusQuery = spClSess
        .from('status_master')
        .select('rel_id, pub_id, user_rel_id')
        .eq('user_rel_id', userRelId);

    if (stateId === 'latest') {
        statusQuery = statusQuery.order('started_at', { ascending: false }).limit(1);
    } else {
        statusQuery = statusQuery.eq('pub_id', stateId);
    }

    const { data: statusData, error: statusError } = await statusQuery.single();

    if (statusError) {
        if (statusError.code === 'PGRST116') {
            return new ApiErrorNotFound('Status').into_resp(c);
        }
        await FatalErrorHandler(c, statusError, "fetching status");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!statusData || statusData.user_rel_id !== userRelId) {
        return new ApiErrorNotFound('Status').into_resp(c);
    }

    const statusRelId = statusData.rel_id;
    const statusPubId = statusData.pub_id;

    // ステータス削除（CASCADE で関連レコードも削除される）
    const { error: deleteError } = await spClSess
        .from('status_master')
        .delete()
        .eq('rel_id', statusRelId);

    if (deleteError) {
        await FatalErrorHandler(c, deleteError, "deleting status");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const response = {
        pub_id: statusPubId,
        deleted: true
    };

    return c.json(response);
}
