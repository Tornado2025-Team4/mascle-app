import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

interface reqBody {
    started_at: string;
    is_auto_detected?: boolean;
    gym_pub_id?: string;
    partners?: {
        pub_id: string;
    }[];
}

interface respBody {
    pub_id: string;
}

export default async function post(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const body = await c.req.json() as reqBody;

    if (!body.started_at) {
        throw new ApiErrorBadRequest('started_at is required');
    }

    const startedAt = new Date(body.started_at);
    if (isNaN(startedAt.getTime())) {
        throw new ApiErrorBadRequest('Invalid started_at format');
    }

    if (startedAt > new Date()) {
        throw new ApiErrorBadRequest('started_at cannot be in the future');
    }

    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const userRelId = userData.rel_id;

    let gymRelId: number | null = null;
    if (body.gym_pub_id) {
        const { data: gymData, error: gymError } = await spClSess
            .from('gyms_master')
            .select('rel_id')
            .eq('pub_id', body.gym_pub_id)
            .single();

        if (gymError || !gymData) {
            throw new ApiErrorBadRequest(`Gym not found: ${body.gym_pub_id}`);
        }
        gymRelId = gymData.rel_id;
    }

    const partnerRelIds: number[] = [];
    if (body.partners && body.partners.length > 0) {
        for (const partner of body.partners) {
            const { data: partnerData, error: partnerError } = await spClSrv
                .from('users_master')
                .select('rel_id')
                .eq('pub_id', partner.pub_id)
                .single();

            if (partnerError || !partnerData) {
                throw new ApiErrorBadRequest(`Partner not found: ${partner.pub_id}`);
            }
            partnerRelIds.push(partnerData.rel_id);
        }
    }

    // トランザクション処理
    const statusPubId = nanoid();

    try {
        // status_masterに挿入
        const { data: statusData, error: statusError } = await spClSess
            .from('status_master')
            .insert({
                pub_id: statusPubId,
                user_rel_id: userRelId,
                started_at: startedAt.toISOString(),
                is_auto_detected: body.is_auto_detected || false,
                gym_rel_id: gymRelId
            })
            .select('rel_id')
            .single();

        if (statusError || !statusData) {
            throw new ApiErrorFatal(`Failed to create status: ${statusError?.message}`);
        }

        const statusRelId = statusData.rel_id;

        // パートナーを追加
        if (partnerRelIds.length > 0) {
            const partnerInserts = partnerRelIds.map(partnerRelId => ({
                status_rel_id: statusRelId,
                partner_user_rel_id: partnerRelId
            }));

            const { error: partnersError } = await spClSess
                .from('status_lines_partners')
                .insert(partnerInserts);

            if (partnersError) {
                throw new ApiErrorFatal(`Failed to add partners: ${partnersError.message}`);
            }
        }

        return c.json({
            pub_id: statusPubId
        } as respBody);

    } catch (error) {
        if (error instanceof ApiErrorFatal || error instanceof ApiErrorBadRequest) {
            throw error;
        }
        throw new ApiErrorFatal(`Unexpected error: ${error}`);
    }
}