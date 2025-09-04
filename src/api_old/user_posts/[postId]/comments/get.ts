/**
 * GET /user_posts/:postId/comments
 *
 * Path Parameters:
 * - postId: string - 投稿ID（pub_id）
 *
 * Query Parameters:
 * - ids?: string - コメントIDのカンマ区切りリスト
 * - user_ids?: string - コメントしたユーザーIDのカンマ区切りリスト
 * - before?: string - このコメントID以前のコメントを取得
 * - after?: string - このコメントID以降のコメントを取得
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 * - restart_pub_id?: string - ページネーション用の再開ID
 * - resolve_commenter_icon_url?: boolean - コメント者アイコンの署名URLを生成するかどうか（デフォルト: false）
 * - resolve_mention_icon_url?: boolean - メンション先ユーザーアイコンの署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * [{
 *   pub_id: string;
 *   post_pub_id: string;
 *   user_uuid: string;
 *   user_handle_id: string;
 *   user_display_name: string | null;
 *   user_icon: string | null;
 *   user_icon_path: string | null;
 *   user_icon_url?: string | null;
 *   commented_at: string;
 *   body: string;
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
import { ApiErrorNotFound, ApiErrorBadRequest, ApiErrorInternalServerError, FatalErrorHandler } from '../../../_cmn/error';
import { checkPostAccess } from '../../../_mw/check_privacy_access';

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

  const ids = c.req.query('ids');
  const userIds = c.req.query('user_ids');
  const before = c.req.query('before');
  const after = c.req.query('after');
  const restartPubId = c.req.query('restart_pub_id');
  const limitRaw = c.req.query('limit');
  const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

  const resolveCommenterIconUrl = c.req.query('resolve_commenter_icon_url') === 'true';
  const resolveMentionIconUrl = c.req.query('resolve_mention_icon_url') === 'true';

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

  const { data: post, error: postError } = await spClSess
    .from('view_user_posts')
    .select('rel_id, pub_id, user_rel_id, visibility')
    .eq('pub_id', postId)
    .single();

  if (postError || !post) {
    return new ApiErrorNotFound('Post').into_resp(c);
  }

  // 投稿へのアクセス権をチェック
  const { canAccess } = await checkPostAccess(
    c,
    post.user_rel_id,
    post.visibility
  );

  if (!canAccess) {
    return new ApiErrorNotFound('Post').into_resp(c);
  }

  let query = spClSess
    .from('user_lines_post_comments')
    .select(`
            pub_id,
            user_rel_id,
            commented_at,
            comment_plain
        `)
    .eq('post_rel_id', post.rel_id)
    .order('commented_at', { ascending: false })
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

    if (before) {
      const { data: beforeComment, error: beforeError } = await spClSess
        .from('user_lines_post_comments')
        .select('commented_at')
        .eq('pub_id', before)
        .single();

      if (beforeError) {
        return new ApiErrorBadRequest('Invalid before parameter').into_resp(c);
      }

      if (beforeComment) {
        query = query.lt('commented_at', beforeComment.commented_at);
      }
    }

    if (after) {
      const { data: afterComment, error: afterError } = await spClSess
        .from('user_lines_post_comments')
        .select('commented_at')
        .eq('pub_id', after)
        .single();

      if (afterError) {
        return new ApiErrorBadRequest('Invalid after parameter').into_resp(c);
      }

      if (afterComment) {
        query = query.gt('commented_at', afterComment.commented_at);
      }
    }

    if (restartPubId) {
      const { data: restartComment, error: restartError } = await spClSess
        .from('user_lines_post_comments')
        .select('commented_at')
        .eq('pub_id', restartPubId)
        .single();

      if (restartError) {
        return new ApiErrorBadRequest('Invalid restart_pub_id parameter').into_resp(c);
      }

      if (restartComment) {
        query = query.lt('commented_at', restartComment.commented_at);
      }
    }
  }

  const { data: comments, error } = await query;

  if (error) {
    await FatalErrorHandler(c, error, "fetching comments");
    return new ApiErrorInternalServerError().into_resp(c);
  }

  if (!comments || comments.length === 0) {
    return c.json([]);
  }

  const result = [];

  for (const comment of comments) {
    const { data: profile, error: profileError } = await spClSess
      .from('view_user_profile_online')
      .select(`
            handle_id,
            display_name,
            icon,
            icon_path,
            users_master!rel_id(in_spbs_id)
        `)
      .eq('rel_id', comment.user_rel_id)
      .single();

    if (profileError) {
      continue;
    }

    let userIconUrl: string | null = null;
    if (resolveCommenterIconUrl && profile?.icon) {
      try {
        const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
          .from('user_icons')
          .createSignedUrl(profile.icon, 60 * 60);

        if (!signedUrlError && signedUrlData?.signedUrl) {
          userIconUrl = signedUrlData.signedUrl;
        }
      } catch (e) {
        await FatalErrorHandler(c, e, "creating signed URL for commenter icon");
      }
    }

    const { data: mentions, error: mentionError } = await spClSess
      .from('user_lines_post_comments_lines_mentions')
      .select(`
                rel_id,
                offset_num,
                target_user_rel_id
            `)
      .eq('comment_rel_id', comment.rel_id);

    if (mentionError) {
      await FatalErrorHandler(c, mentionError, "fetching comment mentions");
      return new ApiErrorInternalServerError().into_resp(c);
    }

    const mentionList = [];
    if (mentions) {
      for (const mention of mentions) {
        const { data: mentionProfile, error: mentionProfileError } = await spClSess
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

        if (mentionProfileError) {
          continue;
        }

        let mentionIconUrl: string | null = null;

        if (resolveMentionIconUrl && mentionProfile?.icon) {
          try {
            const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
              .from('user_icons')
              .createSignedUrl(mentionProfile.icon, 60 * 60);

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
            uuid: mentionProfile?.users_master?.in_spbs_id || '',
            handle: mentionProfile?.handle_id || '',
            display_name: mentionProfile?.display_name || null,
            description: mentionProfile?.description || null,
            icon: mentionProfile?.icon || null,
            icon_path: mentionProfile?.icon_path ? (
              Array.isArray(mentionProfile.icon_path)
                ? mentionProfile.icon_path.join('/')
                : mentionProfile.icon_path
            ) : null,
            icon_url: resolveMentionIconUrl ? mentionIconUrl : undefined
          }
        });
      }
    }

    result.push({
      pub_id: comment.pub_id,
      post_pub_id: postId,
      user_uuid: profile?.users_master?.in_spbs_id || '',
      user_handle_id: profile?.handle_id || '',
      user_display_name: profile?.display_name || null,
      user_icon: profile?.icon || null,
      user_icon_path: profile?.icon_path ? (
        Array.isArray(profile.icon_path)
          ? profile.icon_path.join('/')
          : profile.icon_path
      ) : null,
      user_icon_url: resolveCommenterIconUrl ? userIconUrl : undefined,
      commented_at: comment.commented_at,
      body: comment.comment_plain,
      mentions: mentionList
    });
  }

  return c.json(result);
}