import { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { ApiErrorFatal } from "./error";

export enum noticeKinds {
    MATCHING_OFFLINE_SAME_GYM = 'matching/offline/same-gym',
    MATCHING_ONLINE_RECOMMEND = 'matching/online/recommend',
    SOCIAL_FOLLOWER_ADDED = 'social/follower-added',
    SOCIAL_FOLLOWING_POSTED = 'social/following-posted',
    SOCIAL_FOLLOWING_STARTED_TRAINING = 'social/following-started-training',
    SOCIAL_TRAINING_PARTNER_REQUEST = 'social/training-partner-request',
    POST_LIKED = 'post/liked',
    POST_COMMENTED = 'post/commented',
    POST_MENTIONED = 'post/mentioned',
    DM_PAIR_INVITE_RECEIVED = 'dm/pair/invite-received',
    DM_PAIR_REQUEST_ACCEPTED = 'dm/pair/request-accepted',
    DM_PAIR_RECEIVED = 'dm/pair/received',
    DM_GROUP_INVITE_RECEIVED = 'dm/group/invite-received',
    DM_GROUP_REQUEST_ACCEPTED = 'dm/group/request-accepted',
    DM_GROUP_REQUEST_RECEIVED = 'dm/group/request-received',
    DM_GROUP_MEMBER_ADDED = 'dm/group/member-added',
    DM_GROUP_RECEIVED = 'dm/group/received',
    REPORT_RESOLVED = 'report/resolved',
    REPORT_REJECTED = 'report/rejected',
    SYSTEM_WARNING = 'system/warning',
    SYSTEM_ANNOUNCEMENT = 'system/announcement',
    OTHER = 'other'
};

// NOTE: 通知を作成するのはシステムなので、エラーはすべてApiErrorFatalにする

export interface NotificationTarget {
    pub_id: string;
    should_be_anon: boolean;
}

export const sendMessage = async (
    spClSrv: SupabaseClient,
    kind: noticeKinds,
    igniterPubId: string | null,
    targets: NotificationTarget[],
) => {
    if (targets.length === 0) {
        return;
    }

    // igniterのrel_idを取得
    let igniterUserRelId: number | null = null;
    if (igniterPubId) {
        const { data: igniterData, error: igniterError } = await spClSrv
            .from('users_master')
            .select('rel_id')
            .eq('pub_id', igniterPubId)
            .single();

        if (igniterError || !igniterData) {
            throw new ApiErrorFatal(`Igniter user not found: ${igniterPubId}`);
        }
        igniterUserRelId = igniterData.rel_id;
    }

    // ターゲットユーザーのrel_idを取得
    const targetPubIds = targets.map(t => t.pub_id);
    const { data: targetsData, error: targetsError } = await spClSrv
        .from('users_master')
        .select('rel_id, pub_id')
        .in('pub_id', targetPubIds);

    if (targetsError) {
        throw new ApiErrorFatal(`Failed to fetch target users: ${targetsError.message}`);
    }

    if (!targetsData || targetsData.length === 0) {
        return; // ターゲットユーザーが見つからない場合は何もしない
    }

    // 通知を作成
    const noticePubId = nanoid();

    const { data: noticeData, error: noticeError } = await spClSrv
        .from('notices_master')
        .insert({
            pub_id: noticePubId,
            kind: kind,
            igniter_user_rel_id: igniterUserRelId,
        })
        .select('rel_id')
        .single();

    if (noticeError || !noticeData) {
        throw new ApiErrorFatal(`Failed to create notice: ${noticeError?.message}`);
    }

    // pub_id から should_be_anon フラグを取得するマップを作成
    const anonFlagMap = new Map(targets.map(t => [t.pub_id, t.should_be_anon]));

    // 各ターゲットユーザーに通知を割り当て（ユーザーごとの匿名化設定を含む）
    const assignmentInserts = targetsData.map(target => ({
        notice_rel_id: noticeData.rel_id,
        target_user_rel_id: target.rel_id,
        is_read: false,
        should_be_anon: anonFlagMap.get(target.pub_id) || false
    }));

    const { error: assignmentError } = await spClSrv
        .from('notices_lines_assigned_users')
        .insert(assignmentInserts);

    if (assignmentError) {
        throw new ApiErrorFatal(`Failed to assign notices: ${assignmentError.message}`);
    }

    return noticePubId;
}