import { Context } from "hono";
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

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

    return {
        only_unread,
        igniter,
        before,
        after,
        limit
    };
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
                    pub_id: notice.igniter_user.pub_id || undefined,
                    anon_pub_id: notice.igniter_user.anon_pub_id || undefined,
                    handle: notice.igniter_user.handle || undefined,
                    display_name: notice.igniter_user.display_name || undefined,
                    description: notice.igniter_user.description || undefined,
                    tags: notice.igniter_user.tags || [],
                    icon_url,
                    skill_level: notice.igniter_user.skill_level || undefined,
                    followings_count: notice.igniter_user.followings_count || undefined,
                    followers_count: notice.igniter_user.followers_count || undefined,
                };
            }

            return {
                pub_id: notice.pub_id,
                is_read: notice.is_read,
                notified_at: notice.notified_at,
                kind: notice.kind,
                igniter_user
            };
        })
    );

    return c.json(processedNotices);
}