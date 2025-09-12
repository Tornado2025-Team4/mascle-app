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
    icon_rel_id?: string;
    icon_name?: string;
}

interface Mention {
    user_pub_id: string;
    display_name?: string;
}

interface Photo {
    url_name: string;
    thumb_url_name?: string;
}

interface PostRow {
    pub_id: string;
    user_summary: UserSummary;
    posted_at: string;
    body: string;
    mentions?: Mention[];
    tags?: string[];
    photos?: Photo[];
    likes_count?: number;
    comments_count?: number;
    status_pub_id?: string;
    privacy_allowed_posts: boolean;
}

interface reqQuery {
    posted_user_pub_id?: string;
    mentioned_user_pub_id?: string;
    following?: boolean;
    before?: string;
    after?: string;
    limit: number;
    offset: number;
    body?: string;
    tag?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
    const posted_user_pub_id = c.req.query('posted_user_pub_id');
    const mentioned_user_pub_id = c.req.query('mentioned_user_pub_id');
    const followingRaw = c.req.query('following');
    const before = c.req.query('before');
    const after = c.req.query('after');
    const limitRaw = c.req.query('limit');
    const offsetRaw = c.req.query('offset');
    const body = c.req.query('body');
    const tag = c.req.query('tag');

    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    const following = followingRaw === 'true';

    return {
        posted_user_pub_id,
        mentioned_user_pub_id,
        following,
        before,
        after,
        limit,
        offset,
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

    // followingフィルタには認証が必要
    if (rq.following && !spClSess) {
        throw new ApiErrorFatal('Authentication required for following filter');
    }

    let query = (spClSess || spClAnon)
        .from('views_user_post')
        .select('*')
        .order('posted_at', { ascending: false });

    // フォローしているユーザーの投稿のみフィルタリング
    if (rq.following && spClSess) {
        query = query.eq('is_following_post_author', true);
    }

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

    // 制限数とオフセットの適用
    query = query.range(rq.offset, rq.offset + rq.limit - 1);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch posts: ${error.message}`);
    }

    const filteredData = (data ?? []).filter((row: PostRow) => row.privacy_allowed_posts);

    // 結果をマッピング（アイコンの署名URL生成を含む）
    const result = await Promise.all(filteredData.map(async (row: PostRow) => {
        // posted_userのアイコン署名URL生成
        let profileIconUrl: string | undefined = undefined;
        if (row.user_summary && row.user_summary.icon_name) {
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                    .from('users_icons')
                    .createSignedUrl(row.user_summary.icon_name, 60 * 60);

                if (!signedUrlError && signedUrlData?.signedUrl) {
                    profileIconUrl = signedUrlData.signedUrl;
                }
            } catch (e) {
                console.error('Failed to create signed URL for user icon:', e);
            }
        }

        // フォロー状態を取得（認証されたユーザーのみ）
        let isFollowing = false;
        if (spClSess && userJwtInfo && row.user_summary?.pub_id) {
            const { data: currentUser } = await spClSess
                .from('users_master')
                .select('rel_id')
                .eq('uid', userJwtInfo.obj.id)
                .single();

            const { data: targetUser } = await spClSess
                .from('users_master')
                .select('rel_id')
                .eq('pub_id', row.user_summary.pub_id)
                .single();

            if (currentUser && targetUser) {
                const { data: followingRelation } = await spClSess
                    .from('users_lines_followings')
                    .select('*')
                    .eq('user_rel_id', currentUser.rel_id)
                    .eq('target_user_rel_id', targetUser.rel_id)
                    .single();

                isFollowing = !!followingRelation;
            }
        }

        // user_summaryにprofile_icon_urlとフォロー状態を追加
        const updatedUserSummary = {
            ...row.user_summary,
            profile_icon_url: profileIconUrl,
            is_followed_by_current_user: isFollowing,
            // icon_rel_idとicon_nameを削除（フロントエンドには不要）
            icon_rel_id: undefined,
            icon_name: undefined
        };

        // 写真の署名URL生成
        const processedPhotos = await Promise.all((row.photos || []).map(async (photo: Photo) => {
            let photoUrl = photo.url_name;
            let thumbUrl = photo.thumb_url_name;

            // メイン画像の署名URL生成
            if (photo.url_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('posts_photos')
                        .createSignedUrl(photo.url_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        photoUrl = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for photo:', e);
                }
            }

            // サムネイル画像の署名URL生成
            if (photo.thumb_url_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('posts_photos')
                        .createSignedUrl(photo.thumb_url_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        thumbUrl = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for photo thumb:', e);
                }
            }

            return {
                url: photoUrl,
                thumb_url: thumbUrl
            };
        }));

        return {
            pub_id: row.pub_id,
            posted_user: updatedUserSummary,
            posted_at: new Date(row.posted_at).toISOString(),
            body: row.body,
            mentions: row.mentions || [],
            tags: row.tags || [],
            photos: processedPhotos,
            likes_count: row.likes_count || 0,
            comments_count: row.comments_count || 0,
            status: row.status_pub_id ? { pub_id: row.status_pub_id } : null
        };
    }));

    return c.json(result);
}


/*

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
    icon_rel_id?: string;
    icon_name?: string;
}

interface Mention {
    user_pub_id: string;
    display_name?: string;
}

interface Photo {
    url_name: string;
    thumb_url_name?: string;
}

interface PostRow {
    pub_id: string;
    user_summary: UserSummary;
    posted_at: string;
    body: string;
    mentions?: Mention[];
    tags?: string[];
    photos?: Photo[];
    likes_count?: number;
    comments_count?: number;
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
    following?: boolean;
}

const parseReqQuery = (c: Context): reqQuery => {
    const posted_user_pub_id = c.req.query('posted_user_pub_id');
    const mentioned_user_pub_id = c.req.query('mentioned_user_pub_id');
    const before = c.req.query('before');
    const after = c.req.query('after');
    const limitRaw = c.req.query('limit');
    const body = c.req.query('body');
    const tag = c.req.query('tag');
    const followingRaw = c.req.query('following');

    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;
    const following = followingRaw === 'true';

    return {
        posted_user_pub_id,
        mentioned_user_pub_id,
        before,
        after,
        limit,
        body,
        tag,
        following
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

    // フォローしているユーザーの投稿のみを表示
    if (rq.following && currentUserId && spClSess) {
        console.log('Debug: Starting following filter logic');
        console.log('Debug: currentUserId:', currentUserId);

        // 現在のユーザーのrel_idを取得（サービスキーを使用）
        const { data: currentUserData, error: currentUserError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('pub_id', currentUserId)
            .single();

        console.log('Debug: currentUserData:', currentUserData);
        console.log('Debug: currentUserError:', currentUserError);

        if (currentUserData?.rel_id) {
            const currentUserRelId = currentUserData.rel_id;
            console.log('Debug: currentUserRelId:', currentUserRelId);

            // フォローしているユーザーのrel_idを取得（サービスキーを使用）
            const { data: followingRelIds, error: followingError } = await spClSess
                .from('users_lines_followings')
                .select('target_user_rel_id')
                .eq('user_rel_id', currentUserRelId);

            console.log('Debug: followingRelIds:', followingRelIds);
            console.log('Debug: followingError:', followingError);

            if (followingError) {
                console.error('Error fetching following users:', followingError);
                return c.json([]);
            }

            if (followingRelIds && followingRelIds.length > 0) {
                const targetRelIds = followingRelIds.map(f => f.target_user_rel_id);
                console.log('Debug: targetRelIds:', targetRelIds);

                // rel_idからpub_idを取得（サービスキーを使用）
                const { data: followingUsers, error: usersError } = await spClSrv
                    .from('users_master')
                    .select('pub_id')
                    .in('rel_id', targetRelIds);

                console.log('Debug: followingUsers:', followingUsers);
                console.log('Debug: usersError:', usersError);

                if (usersError) {
                    console.error('Error fetching user pub_ids:', usersError);
                    return c.json([]);
                }

                if (followingUsers && followingUsers.length > 0) {
                    const followingUserIds = followingUsers
                        .map(u => u.pub_id)
                        .filter(Boolean); // null/undefinedをフィルタリング

                    console.log('Debug: followingUserIds:', followingUserIds);

                    if (followingUserIds.length > 0) {
                        query = query.in('user_pub_id', followingUserIds);
                        console.log('Debug: Applied following filter to query');
                    } else {
                        console.log('Debug: No valid following user IDs found');
                        return c.json([]);
                    }
                } else {
                    console.log('Debug: No following users found in users_master');
                    return c.json([]);
                }
            } else {
                console.log('Debug: No following relationships found');
                return c.json([]);
            }
        } else {
            console.log('Debug: Current user data not found');
            return c.json([]);
        }
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

        if (currentUserRelId && spClSess) {
            // 投稿のpub_idからrel_idのマッピングを取得
            const postIds = filteredData.map((row: PostRow) => row.pub_id);
            const { data: postRelData } = await spClSrv
                .from('posts_master')
                .select('pub_id, rel_id')
                .in('pub_id', postIds);

            if (postRelData && postRelData.length > 0) {
                const postRelIds = postRelData.map((post: PostRelation) => post.rel_id);

                // 一度にいいね情報を取得
                const { data: likesData } = await spClSess
                    .from('posts_lines_likes')
                    .select('post_rel_id')
                    .in('post_rel_id', postRelIds)
                    .eq('user_rel_id', currentUserRelId);

                // 一度にコメント情報を取得
                const { data: commentsData } = await spClSess
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

    // 結果をマッピング（署名付きURLを生成）
    const result = await Promise.all(filteredData.map(async (row: PostRow) => {
        // 写真の署名付きURL生成
        const photosWithSignedUrls = await Promise.all(
            (row.photos || []).map(async (photo: Photo) => {
                // url_nameがストレージIDかファイル名かを判断
                const isStorageId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photo.url_name);

                let url: string | null = null;
                let thumb_url: string | null = null;

                if (isStorageId) {
                    // ストレージIDの場合、署名付きURLを生成
                    url = await createSignedUrlFromStorageId(spClSrv, 'posts_photos', photo.url_name);
                    thumb_url = await createSignedUrlFromStorageId(spClSrv, 'posts_photos_thumb', photo.thumb_url_name);
                } else {
                    // ファイル名の場合、直接署名付きURLを生成
                    const { data: signedUrl, error } = await spClSrv.storage
                        .from('posts_photos')
                        .createSignedUrl(photo.url_name, 60 * 60);

                    url = error ? null : signedUrl?.signedUrl || null;

                    const { data: thumbSignedUrl, error: thumbError } = await spClSrv.storage
                        .from('posts_photos_thumb')
                        .createSignedUrl(photo.thumb_url_name, 60 * 60);

                    thumb_url = thumbError ? null : thumbSignedUrl?.signedUrl || null;
                }

                return {
                    url: url || photo.url_name,
                    thumb_url: thumb_url || photo.thumb_url_name
                };
            })
        );

        return {
            pub_id: row.pub_id,
            posted_user: row.user_summary,
            posted_at: new Date(row.posted_at).toISOString(),
            body: row.body,
            mentions: row.mentions || [],
            tags: row.tags || [],
            photos: photosWithSignedUrls,
            likes_count: row.likes_count || 0,
            is_liked_by_current_user: userLikes.has(row.pub_id),
            comments_count: row.comments_count || 0,
            is_commented_by_current_user: userComments.has(row.pub_id),
            status: row.status_pub_id ? { pub_id: row.status_pub_id } : null
        };
    }));

    return c.json(result);
}


 */