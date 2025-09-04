import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorForbidden, ApiErrorUnprocessable } from '../../../../_cmn/error';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';

interface ReqBody {
    gym_pub_id?: string;
    is_auto_detected?: boolean;
}


// >! フロントから時刻指定できるように

export default async function post(c: Context) {
    const spCl = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden("User info access", "Cannot modify status by anon id");
    }

    let reqBody: ReqBody;
    try {
        reqBody = await c.req.json();
    } catch {
        reqBody = {};
    }

    const gymPubId = reqBody.gym_pub_id;
    const isAutoDetected = reqBody.is_auto_detected ?? false;

    const { data: userData, error: userError } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    let gymRelId = null;
    if (gymPubId) {
        const { data: gymData, error: gymError } = await spCl
            .from('gyms_master')
            .select('rel_id')
            .eq('pub_id', gymPubId)
            .single();

        if (gymError || !gymData) {
            throw new ApiErrorUnprocessable('gym_pub_id', 'Invalid gym_pub_id');
        }
        gymRelId = gymData.rel_id;
    }

    const { error: insertError } = await spCl
        .from('status_master')
        .insert({
            pub_id: nanoid(21),
            user_rel_id: userData.rel_id,
            started_at: new Date().toISOString(),
            is_auto_detected: isAutoDetected,
            gym_rel_id: gymRelId
        });

    if (insertError) {
        throw new ApiErrorFatal(`Failed to start training: ${insertError.message}`);
    }

    return c.json({});
}