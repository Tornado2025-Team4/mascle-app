/**
 * GET /user_posts
 *
 * Query Parameters:
 * - ids?: string - 投稿IDのカンマ区切りリスト（idsが指定された場合、他のフィルターは無視）
 * - user_ids?: string - ユーザーIDのカンマ区切りリスト
 * - tag_ids?: string - タグIDのカンマ区切りリスト
 * - gym_ids?: string - ジムIDのカンマ区切りリスト
 * - liked_by_user_ids?: string - いいねしたユーザーIDのカンマ区切りリスト
 * - commented_by_user_ids?: string - コメントしたユーザーIDのカンマ区切りリスト
 * - before?: string - この投稿ID以前の投稿を取得
 * - after?: string - この投稿ID以降の投稿を取得
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 * - restart_pub_id?: string - ページネーション用の再開ID
 * - resolve_poster_icon_url?: boolean - 投稿者アイコンの署名URLを生成するかどうか（デフォルト: false）
 * - resolve_mention_icon_url?: boolean - メンション先ユーザーアイコンの署名URLを生成するかどうか（デフォルト: false）
 * - resolve_photo_url?: boolean - 写真の署名URLを生成するかどうか（デフォルト: false）
 * - resolve_photo_thumb_url?: boolean - サムネイル写真の署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * [{
 *   pub_id: string;
 *   user_uuid: string;
 *   user_handle_id: string;
 *   user_display_name: string | null;
 *   user_icon: string | null;
 *   user_icon_path: string | null;
 *   user_icon_url?: string | null;
 *   posted_at: string;
 *   body: string;
 *   tags: string[];
 *   visibility: string;
 *   gym_pub_id: string | null;
 *   gym_name: string | null;
 *   like_count: number;
 *   comment_count: number;
 *   is_liked_by_current_user: boolean;
 *   is_commented_by_current_user: boolean;
 *   photo_count: number;
 *   photos: Array<{
 *     url?: string;
 *     thumb_url?: string;
 *   }>;
 *   mentions: Array<{
 *     rel_id: number;
 *     offset_num: number;
 *     target_user_rel_id: number;
 *     profile: {
 *       uuid: string;
 *       handle: string;
 *       display_name: string | null;
 *       description: string | null;
 *       icon: string | null;
 *       icon_path: string | null;
 *       icon_url?: string | null;
 *     };
 *   }>;
 * }]
 */

import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorInternalServerError, FatalErrorHandler } from '../_cmn/error';
import { checkPostAccess } from '../_mw/check_privacy_access';

export default async function get(c: Context) {
    const spClSess = c.get('supabaseClientSess') || c.get('supabaseClientAnon');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClient not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const ids = c.req.query('ids');
    const userIds = c.req.query('user_ids');
    const tagIds = c.req.query('tag_ids');
    const gymIds = c.req.query('gym_ids');
    const likedByUserIds = c.req.query('liked_by_user_ids');
    const commentedByUserIds = c.req.query('commented_by_user_ids');
    const before = c.req.query('before');
    const after = c.req.query('after');
    const restartPubId = c.req.query('restart_pub_id');
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    const resolvePosterIconUrl = c.req.query('resolve_poster_icon_url') === 'true';
    const resolveMentionIconUrl = c.req.query('resolve_mention_icon_url') === 'true';
    const resolvePhotoUrl = c.req.query('resolve_photo_url') === 'true';
    const resolvePhotoThumbUrl = c.req.query('resolve_photo_thumb_url') === 'true';

    const userAuthnInfo = c.get('userAuthnInfo');
    let currentUserRelId: number | null = null;
    if (userAuthnInfo) {
        const { data: userData, error: userError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', userAuthnInfo.userObj.id)
            .single();
        if (userData && !userError) {
            currentUserRelId = userData.rel_id;
        }
    }

    if (currentUserRelId) {
        await spClSess.rpc('set_config', {
            setting: 'app.current_user_rel_id',
            value: currentUserRelId.toString()
        });
    }

    let query = spClSess
        .from('view_user_posts')
        .select(`
            pub_id,
            user_rel_id,
            poster_handle_id,
            poster_display_name,
            poster_icon,
            posted_at,
            body_plain,
            tags,
            visibility,
            gym_rel_id,
            gym_name,
            like_count,
            comment_count,
            is_liked_by_current_user,
            photo_count,
            users_master!inner(in_spbs_id),
            gym_master(pub_id)
        `)
        .order('posted_at', { ascending: false })
        .limit(limit);

    if (ids) {
        const idList = ids.split(',').map(id => id.trim());
        query = query.in('pub_id', idList);
    } else {
        if (userIds) {
            const userIdList = userIds.split(',').map(id => id.trim());
            const { data: resolvedUsers, error: resolveError } = await spClSess
                .from('users_master')
                .select('rel_id')
                .or(`in_spbs_id.in.(${userIdList.join(',')}),handle_id.in.(${userIdList.join(',')})`);

            if (resolveError) {
                await FatalErrorHandler(c, resolveError, "resolving user IDs");
                return new ApiErrorInternalServerError().into_resp(c);
            }

            if (resolvedUsers && resolvedUsers.length > 0) {
                const userRelIds = resolvedUsers.map((u: { rel_id: number }) => u.rel_id);
                query = query.in('user_rel_id', userRelIds);
            }
        }

        if (tagIds) {
            const tagIdList = tagIds.split(',').map(id => id.trim());
            const { data: taggedPosts, error: tagError } = await spClSess
                .from('user_posts_lines_tags')
                .select('post_rel_id, user_tags_master!inner(pub_id)')
                .in('user_tags_master.pub_id', tagIdList);

            if (tagError) {
                await FatalErrorHandler(c, tagError, "filtering by tags");
                return new ApiErrorInternalServerError().into_resp(c);
            }

            if (taggedPosts && taggedPosts.length > 0) {
                const postRelIds = taggedPosts.map((t: { post_rel_id: number }) => t.post_rel_id);
                query = query.in('rel_id', postRelIds);
            } else {
                return c.json([]);
            }
        }

        if (gymIds) {
            const gymIdList = gymIds.split(',').map(id => id.trim());
            query = query.in('gym_master.pub_id', gymIdList);
        }

        if (likedByUserIds) {
            const userIdList = likedByUserIds.split(',').map(id => id.trim());
            const { data: resolvedUsers, error: resolveError } = await spClSess
                .from('users_master')
                .select('rel_id')
                .or(`in_spbs_id.in.(${userIdList.join(',')}),handle_id.in.(${userIdList.join(',')})`);

            if (resolveError) {
                await FatalErrorHandler(c, resolveError, "resolving liked_by user IDs");
                return new ApiErrorInternalServerError().into_resp(c);
            }

            if (resolvedUsers && resolvedUsers.length > 0) {
                const userRelIds = resolvedUsers.map((u: { rel_id: number }) => u.rel_id);
                const { data: likedPosts, error: likeError } = await spClSess
                    .from('user_lines_post_like')
                    .select('post_rel_id')
                    .in('user_rel_id', userRelIds);

                if (likeError) {
                    await FatalErrorHandler(c, likeError, "filtering by likes");
                    return new ApiErrorInternalServerError().into_resp(c);
                }

                if (likedPosts && likedPosts.length > 0) {
                    const postRelIds = likedPosts.map((l: { post_rel_id: number }) => l.post_rel_id);
                    query = query.in('rel_id', postRelIds);
                } else {
                    return c.json([]);
                }
            }
        }

        if (commentedByUserIds) {
            const userIdList = commentedByUserIds.split(',').map(id => id.trim());
            const { data: resolvedUsers, error: resolveError } = await spClSess
                .from('users_master')
                .select('rel_id')
                .or(`in_spbs_id.in.(${userIdList.join(',')}),handle_id.in.(${userIdList.join(',')})`);

            if (resolveError) {
                await FatalErrorHandler(c, resolveError, "resolving commented_by user IDs");
                return new ApiErrorInternalServerError().into_resp(c);
            }

            if (resolvedUsers && resolvedUsers.length > 0) {
                const userRelIds = resolvedUsers.map((u: { rel_id: number }) => u.rel_id);
                const { data: commentedPosts, error: commentError } = await spClSess
                    .from('user_lines_post_comments')
                    .select('post_rel_id')
                    .in('user_rel_id', userRelIds);

                if (commentError) {
                    await FatalErrorHandler(c, commentError, "filtering by comments");
                    return new ApiErrorInternalServerError().into_resp(c);
                }

                if (commentedPosts && commentedPosts.length > 0) {
                    const postRelIds = commentedPosts.map((c: { post_rel_id: number }) => c.post_rel_id);
                    query = query.in('rel_id', postRelIds);
                } else {
                    return c.json([]);
                }
            }
        }

        if (before) {
            const { data: beforePost, error: beforeError } = await spClSess
                .from('user_posts_master')
                .select('posted_at')
                .eq('pub_id', before)
                .single();

            if (beforeError) {
                return new ApiErrorBadRequest('Invalid before parameter').into_resp(c);
            }

            if (beforePost) {
                query = query.lt('posted_at', beforePost.posted_at);
            }
        }

        if (after) {
            const { data: afterPost, error: afterError } = await spClSess
                .from('user_posts_master')
                .select('posted_at')
                .eq('pub_id', after)
                .single();

            if (afterError) {
                return new ApiErrorBadRequest('Invalid after parameter').into_resp(c);
            }

            if (afterPost) {
                query = query.gt('posted_at', afterPost.posted_at);
            }
        }

        if (restartPubId) {
            const { data: restartPost, error: restartError } = await spClSess
                .from('user_posts_master')
                .select('posted_at')
                .eq('pub_id', restartPubId)
                .single();

            if (restartError) {
                return new ApiErrorBadRequest('Invalid restart_pub_id parameter').into_resp(c);
            }

            if (restartPost) {
                query = query.lt('posted_at', restartPost.posted_at);
            }
        }
    }

    const { data: posts, error } = await query;

    if (error) {
        await FatalErrorHandler(c, error, "fetching user posts");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!posts || posts.length === 0) {
        return c.json([]);
    }

    const result = [];

    for (const post of posts) {
        // プライバシー設定とポストの可視性をチェック
        const { canAccess, canSeeLocation } = await checkPostAccess(
            c,
            post.user_rel_id,
            post.visibility
        );

        if (!canAccess) {
            continue; // このポストはスキップ
        }

        let userIconUrl: string | null = null;
        if (resolvePosterIconUrl && post.poster_icon) {
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                    .from('user_icons')
                    .createSignedUrl(post.poster_icon, 60 * 60);

                if (!signedUrlError && signedUrlData?.signedUrl) {
                    userIconUrl = signedUrlData.signedUrl;
                }
            } catch (e) {
                await FatalErrorHandler(c, e, "creating signed URL for user icon");
            }
        }

        const { data: photos, error: photoError } = await spClSess
            .from('user_posts_lines_photos')
            .select(`
                photo,
                photo_thumb,
                storage.objects!photo(path_tokens),
                storage.objects!photo_thumb(path_tokens)
            `)
            .eq('post_rel_id', post.rel_id);

        if (photoError) {
            await FatalErrorHandler(c, photoError, "fetching post photos");
            return new ApiErrorInternalServerError().into_resp(c);
        }

        const photoList = [];
        if (photos) {
            for (const photo of photos) {
                let photoUrl: string | null = null;
                let thumbUrl: string | null = null;

                if (resolvePhotoUrl && photo.photo) {
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                            .from('user_posts_photos')
                            .createSignedUrl(photo.photo, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            photoUrl = signedUrlData.signedUrl;
                        }
                    } catch (e) {
                        await FatalErrorHandler(c, e, "creating signed URL for post photo");
                    }
                }

                if (resolvePhotoThumbUrl && photo.photo_thumb) {
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                            .from('user_posts_photos')
                            .createSignedUrl(photo.photo_thumb, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            thumbUrl = signedUrlData.signedUrl;
                        }
                    } catch (e) {
                        await FatalErrorHandler(c, e, "creating signed URL for post photo thumb");
                    }
                }

                photoList.push({
                    url: resolvePhotoUrl ? photoUrl : undefined,
                    thumb_url: resolvePhotoThumbUrl ? thumbUrl : undefined
                });
            }
        }

        const { data: mentions, error: mentionError } = await spClSess
            .from('user_posts_lines_body_mentions')
            .select(`
                rel_id,
                offset_num,
                target_user_rel_id
            `)
            .eq('post_rel_id', post.rel_id);

        if (mentionError) {
            await FatalErrorHandler(c, mentionError, "fetching post mentions");
            return new ApiErrorInternalServerError().into_resp(c);
        }

        const mentionList = [];
        if (mentions) {
            for (const mention of mentions) {
                const { data: profile, error: profileError } = await spClSess
                    .from('view_user_profile_online')
                    .select(`
                        handle_id,
                        display_name,
                        description,
                        icon,
                        icon_path,
                        users_master!rel_id(in_spbs_id)
                    `)
                    .eq('rel_id', mention.target_user_rel_id)
                    .single();

                if (profileError) {
                    continue;
                }

                let mentionIconUrl: string | null = null;

                if (resolveMentionIconUrl && profile?.icon) {
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                            .from('user_icons')
                            .createSignedUrl(profile.icon, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            mentionIconUrl = signedUrlData.signedUrl;
                        }
                    } catch (e) {
                        await FatalErrorHandler(c, e, "creating signed URL for mention icon");
                    }
                }

                mentionList.push({
                    rel_id: mention.rel_id,
                    offset_num: mention.offset_num,
                    target_user_rel_id: mention.target_user_rel_id,
                    profile: {
                        uuid: profile?.users_master?.in_spbs_id || '',
                        handle: profile?.handle_id || '',
                        display_name: profile?.display_name || null,
                        description: profile?.description || null,
                        icon: profile?.icon || null,
                        icon_path: profile?.icon_path ? (
                            Array.isArray(profile.icon_path)
                                ? profile.icon_path.join('/')
                                : profile.icon_path
                        ) : null,
                        icon_url: resolveMentionIconUrl ? mentionIconUrl : undefined
                    }
                });
            }
        }

        let isCommentedByCurrentUser = false;
        if (currentUserRelId) {
            const { data: userComment, error: commentCheckError } = await spClSess
                .from('user_lines_post_comments')
                .select('rel_id')
                .eq('post_rel_id', post.rel_id)
                .eq('user_rel_id', currentUserRelId)
                .limit(1);

            if (!commentCheckError && userComment && userComment.length > 0) {
                isCommentedByCurrentUser = true;
            }
        }

        result.push({
            pub_id: post.pub_id,
            user_uuid: post.users_master?.in_spbs_id || '',
            user_handle_id: post.poster_handle_id,
            user_display_name: post.poster_display_name,
            user_icon: post.poster_icon,
            user_icon_path: post.poster_icon_path ? (
                Array.isArray(post.poster_icon_path)
                    ? post.poster_icon_path.join('/')
                    : post.poster_icon_path
            ) : null,
            user_icon_url: resolvePosterIconUrl ? userIconUrl : undefined,
            posted_at: post.posted_at,
            body: post.body_plain,
            tags: post.tags || [],
            visibility: post.visibility,
            gym_pub_id: canSeeLocation ? (post.gym_master?.pub_id || null) : null,
            gym_name: canSeeLocation ? post.gym_name : null,
            like_count: post.like_count,
            comment_count: post.comment_count,
            is_liked_by_current_user: post.is_liked_by_current_user,
            is_commented_by_current_user: isCommentedByCurrentUser,
            photo_count: post.photo_count,
            photos: photoList,
            mentions: mentionList
        });
    }

    return c.json(result);
}