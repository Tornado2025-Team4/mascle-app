import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetPath } from '@/src/api/_cmn/get_path';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function deleteStatus(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const stateId = mustGetPath(c, 'stateid');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    // 自分自身のステータスのみ削除可能
    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden('Cannot delete status for anonymous user');
    }

    // latestの場合は最新のステータスpub_idを取得
    let targetStatusPubId = stateId;
    if (stateId === 'latest') {
        const { data: latestStatus, error: latestError } = await spClSess
            .from('views_user_status')
            .select('pub_id')
            .eq('user_pub_id', userIdInfo.pubId)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestError) {
            throw new ApiErrorFatal(`DB access error: ${latestError.message}`);
        }

        if (!latestStatus) {
            throw new ApiErrorNotFound('Status');
        }

        targetStatusPubId = latestStatus.pub_id;
    }

    // ステータスの存在確認と権限チェック
    const { data: statusData, error: statusError } = await spClSrv
        .from('status_master')
        .select('rel_id, user_rel_id')
        .eq('pub_id', targetStatusPubId)
        .single();

    if (statusError) {
        if (statusError.code === 'PGRST116') {
            throw new ApiErrorNotFound('Status');
        }
        throw new ApiErrorFatal(`DB access error: ${statusError.message}`);
    }

    // ユーザーのrel_idを取得して権限確認
    const { data: userData, error: userError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    if (statusData.user_rel_id !== userData.rel_id) {
        throw new ApiErrorForbidden('Cannot delete other user\'s status');
    }

    // ステータスを削除（CASCADE削除により関連データも自動削除される）
    const { error: deleteError } = await spClSess
        .from('status_master')
        .delete()
        .eq('rel_id', statusData.rel_id);

    if (deleteError) {
        throw new ApiErrorFatal(`Failed to delete status: ${deleteError.message}`);
    }

    return c.json({ success: true });
}