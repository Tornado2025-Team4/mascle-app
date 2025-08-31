import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorForbidden, ApiErrorNotFound } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from './_cmn/userid_resolve';

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden("User info access", "Cannot get ids by anon id");
    }
    const { data, error } = await spClAnon
        .from('users_master')
        .select('pub_id, anon_pub_id, handle')
        .eq('pub_id', userIdInfo.pubId)
        .single();
    if (error) {
        throw new ApiErrorFatal(`DB access error ${error.message}`);
    }
    if (!data) {
        throw new ApiErrorNotFound("User");
    }
    return c.json({
        pub_id: data.pub_id,
        anon_pub_id: data.anon_pub_id,
        handle: data.handle
    })
}
