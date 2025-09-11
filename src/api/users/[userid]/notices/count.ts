import { Context } from "hono";
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    const { count, error } = await spClSess
        .from('views_user_notice')
        .select('*', { count: 'exact', head: true })
        .eq('user_pub_id', userIdInfo.pubId)
        .eq('is_read', false);

    if (error) {
        throw new ApiErrorFatal(`DB access error: ${error.message}`);
    }

    return c.json({
        unread_count: count ?? 0
    });
}
