/**
 * GET /user_posts/:postId
 *
 * Path Parameters:
 * - postId: string - 投稿ID（pub_id）
 *
 * Query Parameters:
 * - resolve_poster_icon_url?: boolean - 投稿者アイコンの署名URLを生成するかどうか（デフォルト: false）
 * - resolve_mention_icon_url?: boolean - メンション先ユーザーアイコンの署名URLを生成するかどうか（デフォルト: false）
 * - resolve_photo_url?: boolean - 写真の署名URLを生成するかどうか（デフォルト: false）
 * - resolve_photo_thumb_url?: boolean - サムネイル写真の署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * {
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
 * }
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '../../_cmn/error';
import { checkPostAccess } from '../../_mw/check_privacy_access';

export default async function get(c: Context) {
  const spClSess = c.get('supabaseClientSess') || c.get('supabaseClientAnon');
  if (!spClSess) {
    await FatalErrorHandler(c, "supabaseClient not found in context");
    return new ApiErrorInternalServerError().into_resp(c);
  }

  const postId = c.req.param('postId');
  if (!postId) {
    return new ApiErrorNotFound('Post').into_resp(c);
  }

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

  const { data: post, error } = await spClSess
    .from('view_user_posts')
    .select(`
            pub_id,
            rel_id,
            user_rel_id,
            poster_handle_id,
            poster_display_name,
            poster_icon,
            poster_icon_path,
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
    .eq('pub_id', postId)
    .single();

  if (error || !post) {
    return new ApiErrorNotFound('Post').into_resp(c);
  }

  // プライバシー設定とポストの可視性をチェック
  const { canAccess, canSeeLocation } = await checkPostAccess(
    c,
    post.user_rel_id,
    post.visibility
  );

  if (!canAccess) {
    return new ApiErrorNotFound('Post').into_resp(c);
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

  const result = {
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
  };

  return c.json(result);
}