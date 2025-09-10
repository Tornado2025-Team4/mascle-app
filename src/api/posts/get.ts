import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';
import { UserJwtInfo } from '../_cmn/verify_jwt';

interface UserSummary {
    pub_id?: string;
    display_name: string;
    handle?: string;
    profile_icon_url?: string;
}

interface Mention {
    user_pub_id: string;
    display_name?: string;
}

interface Photo {
    url_name: string;
    thumb_url_name: string;
}

interface PostRow {
    pub_id: string;
    user_summary: UserSummary;
    posted_at: string;
    body: string;
    mentions: Mention[];
    tags: string[];
    photos: Photo[];
    likes_count: number;
    comments_count: number;
    status_pub_id?: string;
    privacy_allowed_posts: boolean;
}

interface PostRelation {
    pub_id: string;
    rel_id: string;
}

interface LikeData {
    post_rel_id: string;
}

interface CommentData {
    post_rel_id: string;
}

interface reqQuery {
    posted_user_pub_id?: string;
    mentioned_user_pub_id?: string;
    before?: string;
    after?: string;
    limit: number;
    body?: string;
    tag?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
    const posted_user_pub_id = c.req.query('posted_user_pub_id');
    const mentioned_user_pub_id = c.req.query('mentioned_user_pub_id');
    const before = c.req.query('before');
    const after = c.req.query('after');
    const limitRaw = c.req.query('limit');
    const body = c.req.query('body');
    const tag = c.req.query('tag');

    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;

    return {
        posted_user_pub_id,
        mentioned_user_pub_id,
        before,
        after,
        limit,
        body,
        tag
    } as reqQuery;
};

export default async function get(c: Context) {
    const spClSess = c.get('supabaseClientSess') as SupabaseClient | null;
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
    const userJwtInfo = c.get('userJwtInfo') as UserJwtInfo | null;

    const rq = parseReqQuery(c);
    const currentUserId = userJwtInfo?.obj.id;

    let query = (spClSess || spClAnon)
        .from('views_user_post')
        .select('*')
        .order('posted_at', { ascending: false });

    // 投稿者によるフィルタリング
    if (rq.posted_user_pub_id) {
        query = query.eq('user_pub_id', rq.posted_user_pub_id);
    }

    // メンションされたユーザーによるフィルタリング
    if (rq.mentioned_user_pub_id) {
        query = query.contains('mentions', [{ user_pub_id: rq.mentioned_user_pub_id }]);
    }

    // 日時範囲フィルタリング
    if (rq.before) {
        query = query.lt('posted_at', rq.before);
    }

    if (rq.after) {
        query = query.gt('posted_at', rq.after);
    }

    // 本文検索
    if (rq.body) {
        query = query.ilike('body', `%${rq.body}%`);
    }

    // タグ検索
    if (rq.tag) {
        query = query.contains('tags', [rq.tag]);
    }

    // 制限数の適用
    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch posts: ${error.message}`);
    }

    const filteredData = (data ?? []).filter((row: PostRow) => row.privacy_allowed_posts);

    // 現在のユーザーのrel_idを取得
    let currentUserRelId = null;
    const userLikes: Set<string> = new Set();
    const userComments: Set<string> = new Set();

    if (currentUserId && spClSess && filteredData.length > 0) {
        const { data: userRelData } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('pub_id', currentUserId)
            .single();

        currentUserRelId = userRelData?.rel_id;

        if (currentUserRelId && spClSrv) {
            // 投稿のpub_idからrel_idのマッピングを取得
            const postIds = filteredData.map((row: PostRow) => row.pub_id);
            const { data: postRelData } = await spClSrv
                .from('posts_master')
                .select('pub_id, rel_id')
                .in('pub_id', postIds);

            if (postRelData && postRelData.length > 0) {
                const postRelIds = postRelData.map((post: PostRelation) => post.rel_id);

                // 一度にいいね情報を取得
                const { data: likesData } = await spClSrv
                    .from('posts_lines_likes')
                    .select('post_rel_id')
                    .in('post_rel_id', postRelIds)
                    .eq('user_rel_id', currentUserRelId);

                // 一度にコメント情報を取得
                const { data: commentsData } = await spClSrv
                    .from('comments_master')
                    .select('post_rel_id')
                    .in('post_rel_id', postRelIds)
                    .eq('user_rel_id', currentUserRelId);

                // rel_idからpub_idへのマッピングを作成
                const relIdToPubId = new Map();
                postRelData.forEach((post: PostRelation) => {
                    relIdToPubId.set(post.rel_id, post.pub_id);
                });

                // いいねしたpost_pub_idのセットを作成
                if (likesData) {
                    likesData.forEach((like: LikeData) => {
                        const pubId = relIdToPubId.get(like.post_rel_id);
                        if (pubId) userLikes.add(pubId);
                    });
                }

                // コメントしたpost_pub_idのセットを作成
                if (commentsData) {
                    commentsData.forEach((comment: CommentData) => {
                        const pubId = relIdToPubId.get(comment.post_rel_id);
                        if (pubId) userComments.add(pubId);
                    });
                }
            }
        }
    }

    // 結果をマッピング
    const result = filteredData.map((row: PostRow) => {
        return {
            pub_id: row.pub_id,
            posted_user: row.user_summary,
            posted_at: new Date(row.posted_at).toISOString(),
            body: row.body,
            mentions: row.mentions || [],
            tags: row.tags || [],
            photos: (row.photos || []).map((photo: Photo) => ({
                url: photo.url_name,
                thumb_url: photo.thumb_url_name
            })),
            likes_count: row.likes_count || 0,
            is_liked_by_current_user: userLikes.has(row.pub_id),
            comments_count: row.comments_count || 0,
            is_commented_by_current_user: userComments.has(row.pub_id),
            status: row.status_pub_id ? { pub_id: row.status_pub_id } : null
        };
    });

    return c.json(result);
}
