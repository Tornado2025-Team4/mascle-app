import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { sendMessage, noticeKinds } from '@/src/api/_cmn/send_message';
import { after } from 'next/server'

interface reqBody {
    started_at: string;
    is_auto_detected?: boolean;
    gym_pub_id?: string;
    partners?: {
        pub_id: string;
    }[];
}

interface respBody {
    pub_id: string;
    notification_targets?: string[]; // 通知対象者のpub_idリスト
}

export default async function post(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const body = await c.req.json() as reqBody;

    if (!body.started_at) {
        throw new ApiErrorBadRequest('started_at is required');
    }

    const startedAt = new Date(body.started_at);
    if (isNaN(startedAt.getTime())) {
        throw new ApiErrorBadRequest('Invalid started_at format');
    }

    if (startedAt > new Date()) {
        throw new ApiErrorBadRequest('started_at cannot be in the future');
    }

    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const userRelId = userData.rel_id;

    let gymRelId: number | null = null;
    if (body.gym_pub_id) {
        const { data: gymData, error: gymError } = await spClSess
            .from('gyms_master')
            .select('rel_id')
            .eq('pub_id', body.gym_pub_id)
            .single();

        if (gymError || !gymData) {
            throw new ApiErrorBadRequest(`Gym not found: ${body.gym_pub_id}`);
        }
        gymRelId = gymData.rel_id;
    }

    const partnerRelIds: number[] = [];
    if (body.partners && body.partners.length > 0) {
        for (const partner of body.partners) {
            const { data: partnerData, error: partnerError } = await spClSrv
                .from('users_master')
                .select('rel_id')
                .eq('pub_id', partner.pub_id)
                .single();

            if (partnerError || !partnerData) {
                throw new ApiErrorBadRequest(`Partner not found: ${partner.pub_id}`);
            }
            partnerRelIds.push(partnerData.rel_id);
        }
    }

    const statusPubId = nanoid();

    let notificationTargetsPubIds: string[] = [];

    // ビューでフォロワー通知対象者を取得
    const { data: followerTargetsData, error: followerTargetsError } = await spClSess
        .from('views_notification_targets_followers')
        .select('target_pub_id, should_be_anon')
        .eq('igniter_pub_id', userIdInfo.pubId);

    if (followerTargetsError) {
        console.error('Failed to fetch follower notification targets:', followerTargetsError);
    } else if (followerTargetsData && followerTargetsData.length > 0) {
        notificationTargetsPubIds = followerTargetsData.map(target => target.target_pub_id);
    }

    // ジム通知対象者を取得（ジムが指定されている場合）
    if (gymRelId) {
        const { data: gymTargetsData, error: gymTargetsError } = await spClSess
            .from('views_notification_targets_gym_users')
            .select('target_pub_id, should_be_anon')
            .eq('igniter_pub_id', userIdInfo.pubId)
            .eq('gym_rel_id', gymRelId);

        if (gymTargetsError) {
            console.error('Failed to fetch gym notification targets:', gymTargetsError);
        } else if (gymTargetsData && gymTargetsData.length > 0) {
            const gymTargetPubIds = gymTargetsData.map(target => target.target_pub_id);
            notificationTargetsPubIds = notificationTargetsPubIds.concat(gymTargetPubIds);
        }
    }

    // 重複を除去
    notificationTargetsPubIds = [...new Set(notificationTargetsPubIds)];

    after(async () => {
        try {
            const { data: statusData, error: statusError } = await spClSess
                .from('status_master')
                .insert({
                    pub_id: statusPubId,
                    user_rel_id: userRelId,
                    started_at: startedAt.toISOString(),
                    is_auto_detected: body.is_auto_detected || false,
                    gym_rel_id: gymRelId
                })
                .select('rel_id')
                .single();

            if (statusError || !statusData) {
                throw new ApiErrorFatal(`Failed to create status: ${statusError?.message}`);
            }

            const statusRelId = statusData.rel_id;

            // パートナーを追加
            if (partnerRelIds.length > 0) {
                const partnerInserts = partnerRelIds.map(partnerRelId => ({
                    status_rel_id: statusRelId,
                    partner_user_rel_id: partnerRelId
                }));

                const { error: partnersError } = await spClSess
                    .from('status_lines_partners')
                    .insert(partnerInserts);

                if (partnersError) {
                    throw new ApiErrorFatal(`Failed to add partners: ${partnersError.message}`);
                }
            }

            // ビューで通知対象者を取得（プライバシーチェック・匿名化含む）
            const followerTargetsWithAnon: Array<{ pub_id: string, should_be_anon: boolean }> = [];
            const gymTargetsWithAnon: Array<{ pub_id: string, should_be_anon: boolean }> = [];

            // フォロワー通知対象者を取得
            const { data: followerTargetsData, error: followerTargetsError } = await spClSess
                .from('views_notification_targets_followers')
                .select('target_pub_id, should_be_anon')
                .eq('igniter_pub_id', userIdInfo.pubId);

            if (!followerTargetsError && followerTargetsData) {
                followerTargetsData.forEach(target => {
                    followerTargetsWithAnon.push({
                        pub_id: target.target_pub_id,
                        should_be_anon: target.should_be_anon
                    });
                });
            }

            // ジム通知対象者を取得（ジムが指定されている場合）
            if (gymRelId) {
                const { data: gymTargetsData, error: gymTargetsError } = await spClSess
                    .from('views_notification_targets_gym_users')
                    .select('target_pub_id, should_be_anon')
                    .eq('igniter_pub_id', userIdInfo.pubId)
                    .eq('gym_rel_id', gymRelId);

                if (!gymTargetsError && gymTargetsData) {
                    gymTargetsData.forEach(target => {
                        gymTargetsWithAnon.push({
                            pub_id: target.target_pub_id,
                            should_be_anon: target.should_be_anon
                        });
                    });
                }
            }

            // フォロワーに対する通知を送信
            if (followerTargetsWithAnon.length > 0) {
                await sendMessage(
                    spClSrv,
                    noticeKinds.SOCIAL_FOLLOWING_STARTED_TRAINING,
                    userIdInfo.pubId,
                    followerTargetsWithAnon
                );
            }

            // ジムユーザーに対する通知を送信
            if (gymTargetsWithAnon.length > 0) {
                await sendMessage(
                    spClSrv,
                    noticeKinds.MATCHING_OFFLINE_SAME_GYM,
                    userIdInfo.pubId,
                    gymTargetsWithAnon
                );
            }
        } catch (e) {
            console.error('Error in after function:', e);
        }
    })

    return c.json({
        pub_id: statusPubId,
        notification_targets: notificationTargetsPubIds
    } as respBody);
}
