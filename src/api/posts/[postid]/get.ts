import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorNotFound } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { convDateForFE, precision } from '../../_cmn/conv_date_for_fe';
import { UserJwtInfo } from '../../_cmn/verify_jwt';

export default async function get(c: Context) {
  const spClSess = c.get('supabaseClientSess') as SupabaseClient | null;
  const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
  const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
  const userJwtInfo = c.get('userJwtInfo') as UserJwtInfo | null;

  const postid = c.req.param('postid');
  const currentUserId = userJwtInfo?.obj.id;

  const { data, error } = await (spClSess || spClAnon)
    .from('views_user_post')
    .select('*')
    .eq('pub_id', postid)
    .single();

  if (error || !data || !data.privacy_allowed_posts) {
    throw new ApiErrorNotFound('Post');
  }

  let isLikedByCurrentUser = false;
  let isCommentedByCurrentUser = false;

  if (currentUserId && spClSess) {
    const { data: userRelData } = await spClSess
      .from('users_master')
      .select('rel_id')
      .eq('pub_id', currentUserId)
      .single(); // サービスロールで投稿のrel_idを取得
    const { data: postRelData } = await spClSrv
      .from('posts_master')
      .select('rel_id')
      .eq('pub_id', postid)
      .single();

    if (userRelData && postRelData) {
      const { data: likeData } = await spClSrv
        .from('posts_lines_likes')
        .select('rel_id')
        .eq('post_rel_id', postRelData.rel_id)
        .eq('user_rel_id', userRelData.rel_id)
        .single();

      isLikedByCurrentUser = !!likeData;

      const { data: commentData } = await spClSrv
        .from('comments_master')
        .select('rel_id')
        .eq('post_rel_id', postRelData.rel_id)
        .eq('user_rel_id', userRelData.rel_id)
        .single();

      isCommentedByCurrentUser = !!commentData;
    }
  }

  const result = {
    pub_id: data.pub_id,
    posted_user: data.user_summary,
    posted_at: data.posted_at ? convDateForFE(new Date(data.posted_at), precision.SECOND) : null,
    body: data.body,
    mentions: data.mentions || [],
    tags: data.tags || [],
    photos: (data.photos || []).map((photo: { url_name: string; thumb_url_name: string }) => ({
      url: photo.url_name,
      thumb_url: photo.thumb_url_name
    })),
    likes_count: data.likes_count || 0,
    is_liked_by_current_user: isLikedByCurrentUser,
    comments_count: data.comments_count || 0,
    is_commented_by_current_user: isCommentedByCurrentUser,
    status: data.status_pub_id ? { pub_id: data.status_pub_id } : null
  };

  return c.json(result);
}