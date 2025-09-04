/**
 * GET /users/:userId/notifications
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters:
 * - only_unread?: boolean - 未読のみ取得するかどうか（デフォルト: false）
 * - from_uuid?: string - 特定のユーザーからの通知のみ取得
 * - from_handle?: string - 特定のハンドルからの通知のみ取得（前方一致）
 * - before?: string - 指定日時以前の通知を取得
 * - after?: string - 指定日時以降の通知を取得
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 * - restart_pub_id?: string - 続きから取得するための通知pub_id
 * - resolve_icon_url?: boolean - 通知アイコンの署名URLを生成するかどうか（デフォルト: false）
 * - resolve_mentions_icon_url?: boolean - メンション先のアイコンの署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * Array<{
 *   pub_id: string;
 *   notified_at: string;
 *   kind: string;
 *   title: string;
 *   body_plain: string;
 *   is_oneshot: boolean;
 *   is_read: boolean;
 *   icon: string | null;
 *   icon_path?: string | null;
 *   icon_url?: string | null;
 *   mentions: Array<{
 *     rel_id: number;
 *     offset_num: number;
 *     use_to_notification_icon: boolean;
 *     profile?: {
 *       uuid: string;
 *       handle: string;
 *       display_name: string;
 *       description: string;
 *       icon?: string;
 *       icon_path?: string;
 *       icon_url?: string | null;
 *     };
 *   }>;
 * }>
 */

import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorInternalServerError, FatalErrorHandler } from '../../../_cmn/error';

export default async function get(c: Context) {
    const spClSess = c.get('supabaseClientSess');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const onlyUnread = c.req.query('only_unread') === 'true';
    const fromUuid = c.req.query('from_uuid');
    const fromHandle = c.req.query('from_handle');
    const before = c.req.query('before');
    const after = c.req.query('after');
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;
    const restartPubId = c.req.query('restart_pub_id');
    const resolveIconUrl = c.req.query('resolve_icon_url') === 'true';
    const resolveMentionsIconUrl = c.req.query('resolve_mentions_icon_url') === 'true';

    let restartNotifiedAt: string | undefined = undefined;
    if (restartPubId) {
        const { data: restartRow, error: restartErr } = await spClSess
            .from('user_notifications_master')
            .select('notified_at')
            .eq('pub_id', restartPubId)
            .single();
        if (restartErr || !restartRow) {
            return new ApiErrorBadRequest('Invalid restart_pub_id').into_resp(c);
        }
        restartNotifiedAt = restartRow.notified_at;
    }

    const query = spClSess
        .from('user_notifications_lines_assigned_users')
        .select(`
            notification_rel_id,
            is_read,
            notification:user_notifications_master!inner(
                rel_id, pub_id, notified_at, kind, title, body_plain, is_oneshot, icon, icon_path
            ),
            mentions:user_notifications_lines_mentions(
                rel_id, offset_num, target_user_rel_id, use_to_notification_icon,
                profile:view_user_profile_online(
                    rel_id, in_spbs_id, handle_id, display_name, description, icon, icon_path
                )
            )
        `)
        .order('notification.notified_at', { ascending: false })
        .limit(limit);

    let filteredQuery = query;
    if (onlyUnread) filteredQuery = filteredQuery.eq('is_read', false);
    if (before) filteredQuery = filteredQuery.lt('notification.notified_at', before);
    if (after) filteredQuery = filteredQuery.gt('notification.notified_at', after);
    if (restartPubId && restartNotifiedAt) filteredQuery = filteredQuery.lt('notification.notified_at', restartNotifiedAt);
    if (fromUuid) filteredQuery = filteredQuery.contains('mentions.profile.in_spbs_id', [fromUuid]);
    if (fromHandle) filteredQuery = filteredQuery.ilike('mentions.profile.handle_id', `${fromHandle}%`);

    const { data, error } = await filteredQuery;
    if (error) {
        await FatalErrorHandler(c, error, "fetching user notifications");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    if (!data || data.length === 0) return c.json([]);

    type MentionProfile = {
        in_spbs_id: string;
        handle_id: string;
        display_name: string;
        description: string;
        icon?: string;
        icon_path?: string;
    };
    type MentionRow = {
        rel_id: number;
        offset_num: number;
        target_user_rel_id: number;
        use_to_notification_icon: boolean;
        profile?: MentionProfile;
    };
    type NotifRow = {
        notification: {
            rel_id: number;
            pub_id: string;
            notified_at: string;
            kind: string;
            title: string;
            body_plain: string;
            is_oneshot: boolean;
            icon: string | null;
            icon_path?: string | null;
        };
        is_read: boolean;
        mentions?: MentionRow[];
    };
    type MentionProfileOut = {
        uuid: string;
        handle: string;
        display_name: string;
        description: string;
        icon?: string;
        icon_path?: string;
        icon_url?: string | null;
    };
    type MentionOut = {
        rel_id: number;
        offset_num: number;
        use_to_notification_icon: boolean;
        profile?: MentionProfileOut;
    };
    type NotificationOut = {
        pub_id: string;
        notified_at: string;
        kind: string;
        title: string;
        body_plain: string;
        is_oneshot: boolean;
        is_read: boolean;
        icon: string | null;
        icon_path?: string | null;
        icon_url?: string | null;
        mentions: MentionOut[];
    };
    const result: NotificationOut[] = [];
    for (const row of data as NotifRow[]) {
        const notif = row.notification;
        const is_read = row.is_read;
        const mentions: {
            rel_id: number;
            offset_num: number;
            use_to_notification_icon: boolean;
            profile?: {
                uuid: string;
                handle: string;
                display_name: string;
                description: string;
                icon?: string;
                icon_path?: string;
                icon_url?: string | null;
            };
        }[] = [];
        if (row.mentions && (resolveMentionsIconUrl || row.mentions.length > 0)) {
            for (const m of row.mentions) {
                const p = m.profile;
                let icon_url: string | null = null;
                if (resolveMentionsIconUrl && p?.icon && p?.icon_path) {
                    const bucket = 'users_icons';
                    const iconPath = Array.isArray(p.icon_path) ? p.icon_path.join('/') : p.icon_path;
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                            .from(bucket)
                            .createSignedUrl(iconPath, 60 * 60);
                        if (signedUrlError) {
                            await FatalErrorHandler(c, signedUrlError, "fetching mention icon signed url");
                            return new ApiErrorInternalServerError().into_resp(c);
                        }
                        icon_url = signedUrlData?.signedUrl || null;
                    } catch (e) {
                        await FatalErrorHandler(c, e, "exception fetching mention icon signed url");
                        return new ApiErrorInternalServerError().into_resp(c);
                    }
                }
                mentions.push({
                    rel_id: m.rel_id,
                    offset_num: m.offset_num,
                    use_to_notification_icon: m.use_to_notification_icon,
                    profile: p
                        ? {
                            uuid: p.in_spbs_id,
                            handle: p.handle_id,
                            display_name: p.display_name,
                            description: p.description,
                            icon: p.icon,
                            icon_path: p.icon_path,
                            icon_url: icon_url
                        }
                        : undefined,
                });
            }
        }
        let notif_icon_url: string | null = null;
        if (resolveIconUrl && notif.icon && notif.icon_path) {
            const bucket = 'user_notifications_icons';
            const iconPath = Array.isArray(notif.icon_path) ? notif.icon_path.join('/') : notif.icon_path;
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                    .from(bucket)
                    .createSignedUrl(iconPath, 60 * 60);
                if (signedUrlError) {
                    await FatalErrorHandler(c, signedUrlError, "fetching notification icon signed url");
                    return new ApiErrorInternalServerError().into_resp(c);
                }
                notif_icon_url = signedUrlData?.signedUrl || null;
            } catch (e) {
                await FatalErrorHandler(c, e, "exception fetching notification icon signed url");
                return new ApiErrorInternalServerError().into_resp(c);
            }
        }
        result.push({
            pub_id: notif.pub_id,
            notified_at: notif.notified_at,
            kind: notif.kind,
            title: notif.title,
            body_plain: notif.body_plain,
            is_oneshot: notif.is_oneshot,
            is_read,
            icon: notif.icon,
            icon_path: notif.icon_path,
            icon_url: notif_icon_url,
            mentions: mentions,
        });
    }
    return c.json(result);
}
