import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { sendMessage, noticeKinds, NotificationTarget } from '@/src/api/_cmn/send_message';

export default async function post(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const currentUserId = userJwtInfo.obj.id;
    const targetUserId = userIdInfo.pubId;

    if (currentUserId === targetUserId) {
        throw new ApiErrorBadRequest('自分自身には合トレ希望を送信できません');
    }

    // 現在のユーザーのrel_idを取得
    const { data: currentUserData, error: currentUserError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', currentUserId)
        .single();

    if (currentUserError || !currentUserData) {
        throw new ApiErrorFatal(`Current user not found: ${currentUserError?.message}`);
    }

    // ターゲットユーザーのrel_idを取得
    const { data: targetUserData, error: targetUserError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', targetUserId)
        .single();

    if (targetUserError || !targetUserData) {
        throw new ApiErrorBadRequest('Target user not found');
    }

    // ブロックされていないかチェック
    const { data: blockData, error: blockError } = await spClSrv
        .from('users_lines_rel')
        .select('*')
        .eq('follower_user_rel_id', currentUserData.rel_id)
        .eq('followed_user_rel_id', targetUserData.rel_id)
        .eq('relationship_type', 'block')
        .maybeSingle();

    if (blockError) {
        throw new ApiErrorFatal(`Failed to check block status: ${blockError.message}`);
    }

    if (blockData) {
        throw new ApiErrorForbidden('このユーザーにはリクエストを送信できません');
    }

    // 相手からブロックされていないかチェック
    const { data: blockedByData, error: blockedByError } = await spClSrv
        .from('users_lines_rel')
        .select('*')
        .eq('follower_user_rel_id', targetUserData.rel_id)
        .eq('followed_user_rel_id', currentUserData.rel_id)
        .eq('relationship_type', 'block')
        .maybeSingle();

    if (blockedByError) {
        throw new ApiErrorFatal(`Failed to check blocked by status: ${blockedByError.message}`);
    }

    if (blockedByData) {
        throw new ApiErrorForbidden('このユーザーにはリクエストを送信できません');
    }

    // 通知を送信
    const targets: NotificationTarget[] = [{
        pub_id: targetUserId,
        should_be_anon: false
    }];

    try {
        await sendMessage(
            spClSrv,
            noticeKinds.SOCIAL_TRAINING_PARTNER_REQUEST,
            currentUserId,
            targets
        );

        return c.json({
            success: true,
            message: '合トレ希望を送信しました'
        });
    } catch (error) {
        console.error('Failed to send partner request notification:', error);
        throw new ApiErrorFatal('通知の送信に失敗しました');
    }
}
