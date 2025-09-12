import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorBadRequest } from '@/src/api/_cmn/error';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';

export default async function patch(c: Context) {
    const supa: SupabaseClient = c.get('supabase-sess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    try {
        const body = await c.req.json();
        const { notice_ids } = body;

        if (!Array.isArray(notice_ids)) {
            throw new ApiErrorBadRequest('notice_ids must be an array');
        }

        // 通知を既読にマーク（正しいフィールド名を使用）
        const { error } = await supa
            .from('notices')
            .update({ is_read: true })
            .in('pub_id', notice_ids)
            .eq('notified_user_rel_id', userIdInfo.pubId);

        if (error) {
            throw new ApiErrorFatal(`DB update error: ${error.message}`);
        }

        return c.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiErrorFatal(`Error updating notifications: ${error.message}`);
        }
        throw new ApiErrorFatal('Unknown error occurred');
    }
}