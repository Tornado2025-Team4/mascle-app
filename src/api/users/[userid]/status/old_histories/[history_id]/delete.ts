import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorForbidden, ApiErrorNotFound } from '../../../../../_cmn/error';
import { UserIdInfo } from '../../../_cmn/userid_resolve';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';

export default async function deleteHistory(c: Context) {
    const spCl = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const historyId = c.req.param('history_id');

    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden("User info access", "Cannot delete history by anon id");
    }

    const { data: userData, error: userError } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const { data: historyData, error: historyError } = await spCl
        .from('status_master')
        .select('rel_id')
        .eq('pub_id', historyId)
        .eq('user_rel_id', userData.rel_id)
        .single();

    if (historyError || !historyData) {
        throw new ApiErrorNotFound("Training history");
    }

    const { error: deleteError } = await spCl
        .from('status_master')
        .delete()
        .eq('rel_id', historyData.rel_id);

    if (deleteError) {
        throw new ApiErrorFatal(`Failed to delete training history: ${deleteError.message}`);
    }

    return c.json({});
}