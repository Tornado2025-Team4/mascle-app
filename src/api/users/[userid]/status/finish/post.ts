import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorForbidden, ApiErrorNotFound } from '../../../../_cmn/error';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';

export default async function post(c: Context) {
    const spCl = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden("User info access", "Cannot modify status by anon id");
    }

    const { data: userData, error: userError } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const { data: statusData, error: statusError } = await spCl
        .from('status_master')
        .select('rel_id')
        .eq('user_rel_id', userData.rel_id)
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

    if (statusError || !statusData) {
        throw new ApiErrorNotFound("Active training session");
    }

    const { error: updateError } = await spCl
        .from('status_master')
        .update({ finished_at: new Date().toISOString() })
        .eq('rel_id', statusData.rel_id);

    if (updateError) {
        throw new ApiErrorFatal(`Failed to finish training: ${updateError.message}`);
    }

    return c.json({});
}