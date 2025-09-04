import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorForbidden, ApiErrorNotFound } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from './_cmn/userid_resolve';

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden("User IDs", "Cannot get IDs by anon id");
    }

    const spClService = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const { data, error } = await spClService
        .from('users_master')
        .select('pub_id, anon_pub_id, handle')
        .eq('pub_id', userIdInfo.pubId)
        .single();
    if (error && error.code != 'PGRST116') {
        throw new ApiErrorFatal(`DB access error ${error.message}`);
    }
    if (!data) {
        throw new ApiErrorNotFound("User");
    }
    return c.json({
        pub_id: data.pub_id,
        anon_pub_id: data.anon_pub_id,
        handle: data.handle
    });
}
