import { Context } from "hono";
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { convDateForFE, precision } from '@/src/api/_cmn/conv_date_for_fe';

interface reqQuery {
    only_unread?: boolean;
    igniter?: string; // user_pub_id
    before?: string; // notified_at ISO datetime
    after?: string; // notified_at ISO datetime
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const onlyUnreadRaw = c.req.query('only_unread');
    const only_unread = onlyUnreadRaw === 'true';

    const igniter = c.req.query('igniter');
    const before = c.req.query('before');
    const after = c.req.query('after');

    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    const result: reqQuery = {
        only_unread,
        limit
    };

    if (igniter) result.igniter = igniter;
    if (before) result.before = before;
    if (after) result.after = after;

    return result;
};

interface NoticeItem {
    pub_id: string;
    is_read: boolean;
    notified_at: string;
    kind: string;
    igniter_user?: {
        pub_id?: string;
        anon_pub_id?: string;
        handle?: string;
        display_name?: string;
        description?: string;
        tags?: Array<{
            pub_id: string;
            name: string;
        }>;
        icon_url?: string;
        skill_level?: string;
        followings_count?: number;
        followers_count?: number;
    };
}

interface NoticeViewItem {
    pub_id: string;
    is_read: boolean;
    notified_at: string;
    kind: string;
    igniter_user?: {
        pub_id?: string;
        anon_pub_id?: string;
        handle?: string;
        display_name?: string;
        description?: string;
        tags?: Array<{
            pub_id: string;
            name: string;
        }>;
        icon_rel_id?: string;
        icon_name?: string;
        skill_level?: string;
        followings_count?: number;
        followers_count?: number;
    };
}

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const rq = parseReqQuery(c);

    // クエリ構築
    let query = spClSess
        .from('views_user_notice')
        .select('*')
        .eq('user_pub_id', userIdInfo.pubId);

    // フィルタリング
    if (rq.only_unread) {
        query = query.eq('is_read', false);
    }

    if (rq.igniter) {
        query = query.eq('igniter_user.pub_id', rq.igniter);
    }

    if (rq.before) {
        query = query.lt('notified_at', rq.before);
    }

    if (rq.after) {
        query = query.gt('notified_at', rq.after);
    }

    // ソートと制限
    query = query
        .order('notified_at', { ascending: false })
        .limit(rq.limit);

    const { data: notices, error: noticesError } = await query;

    if (noticesError) {
        throw new ApiErrorFatal(`DB access error: ${noticesError.message}`);
    }

    if (!notices) {
        return c.json({ notices: [] });
    }

    // 署名付きURL生成
    const processedNotices: NoticeItem[] = await Promise.all(
        notices.map(async (notice: NoticeViewItem): Promise<NoticeItem> => {
            let igniter_user;

            if (notice.igniter_user) {
                let icon_url: string | undefined = undefined;

                // アイコンの署名URL生成
                if (notice.igniter_user.icon_rel_id && notice.igniter_user.icon_name) {
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                            .from('users_icons')
                            .createSignedUrl(notice.igniter_user.icon_name, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            icon_url = signedUrlData.signedUrl;
                        }
                    } catch (e) {
                        console.error('Failed to create signed URL for icon:', e);
                    }
                }

                igniter_user = {
                    ...(notice.igniter_user.pub_id && { pub_id: notice.igniter_user.pub_id }),
                    ...(notice.igniter_user.anon_pub_id && { anon_pub_id: notice.igniter_user.anon_pub_id }),
                    ...(notice.igniter_user.handle && { handle: notice.igniter_user.handle }),
                    ...(notice.igniter_user.display_name && { display_name: notice.igniter_user.display_name }),
                    ...(notice.igniter_user.description && { description: notice.igniter_user.description }),
                    ...(notice.igniter_user.tags && { tags: notice.igniter_user.tags }),
                    ...(icon_url && { icon_url }),
                    ...(notice.igniter_user.skill_level && { skill_level: notice.igniter_user.skill_level }),
                    ...(notice.igniter_user.followings_count !== undefined && { followings_count: notice.igniter_user.followings_count }),
                    ...(notice.igniter_user.followers_count !== undefined && { followers_count: notice.igniter_user.followers_count })
                };
            }

            const result: NoticeItem = {
                pub_id: notice.pub_id,
                is_read: notice.is_read,
                notified_at: convDateForFE(new Date(notice.notified_at), precision.SECOND),
                kind: notice.kind
            };

            if (igniter_user) {
                result.igniter_user = igniter_user;
            }

            return result;
        })
    );

    return c.json(processedNotices);
}