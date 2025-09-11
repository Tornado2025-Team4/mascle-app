import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorNotFound } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { UserJwtInfo } from '../../_cmn/verify_jwt';
import { createSignedUrlFromStorageId } from '../../_cmn/image_utils';

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

  // 写真の署名付きURL生成
  const photosWithSignedUrls = await Promise.all(
    (data.photos || []).map(async (photo: { url_name: string; thumb_url_name: string }) => {
      // url_nameがストレージIDかファイル名かを判断
      const isStorageId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photo.url_name);

      let url: string | null = null;
      let thumb_url: string | null = null;

      if (isStorageId) {
        // ストレージIDの場合、署名付きURLを生成
        url = await createSignedUrlFromStorageId(spClSrv, 'post_photos', photo.url_name);
        thumb_url = await createSignedUrlFromStorageId(spClSrv, 'post_photos_thumb', photo.thumb_url_name);
      } else {
        // ファイル名の場合、直接署名付きURLを生成
        const { data: signedUrl, error } = await spClSrv.storage
          .from('post_photos')
          .createSignedUrl(photo.url_name, 60 * 60);

        url = error ? null : signedUrl?.signedUrl || null;

        const { data: thumbSignedUrl, error: thumbError } = await spClSrv.storage
          .from('post_photos_thumb')
          .createSignedUrl(photo.thumb_url_name, 60 * 60);

        thumb_url = thumbError ? null : thumbSignedUrl?.signedUrl || null;
      }

      return {
        url: url || photo.url_name,
        thumb_url: thumb_url || photo.thumb_url_name
      };
    })
  );

  const result = {
    pub_id: data.pub_id,
    posted_user: data.user_summary,
    posted_at: new Date(data.posted_at).toISOString(),
    body: data.body,
    mentions: data.mentions || [],
    tags: data.tags || [],
    photos: photosWithSignedUrls,
    likes_count: data.likes_count || 0,
    is_liked_by_current_user: isLikedByCurrentUser,
    comments_count: data.comments_count || 0,
    is_commented_by_current_user: isCommentedByCurrentUser,
    status: data.status_pub_id ? { pub_id: data.status_pub_id } : null
  };

  return c.json(result);
}