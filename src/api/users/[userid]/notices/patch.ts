import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorBadRequest } from '@/src/api/_cmn/error';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';

export default async function patch(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    try {
        const body = await c.req.json();
        const { notice_ids } = body;

        if (!Array.isArray(notice_ids)) {
            throw new ApiErrorBadRequest('notice_ids must be an array');
        }

        // ユーザーのrel_idを取得
        const { data: userData, error: userError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('pub_id', userIdInfo.pubId)
            .single();

        if (userError || !userData) {
            throw new ApiErrorFatal(`User not found: ${userError?.message}`);
        }

        // まず、通知のpub_idからrel_idを取得
        const { data: noticeData, error: noticeError } = await spClSess
            .from('notices_master')
            .select('rel_id')
            .in('pub_id', notice_ids);

        if (noticeError) {
            throw new ApiErrorFatal(`Notice lookup error: ${noticeError.message}`);
        }

        if (!noticeData || noticeData.length === 0) {
            return c.json({ success: true }); // 該当する通知がない場合
        }

        const noticeRelIds = noticeData.map(n => n.rel_id);

        // 通知を既読にマーク
        const { error } = await spClSess
            .from('notices_lines_assigned_users')
            .update({ is_read: true })
            .eq('target_user_rel_id', userData.rel_id)
            .in('notice_rel_id', noticeRelIds);

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