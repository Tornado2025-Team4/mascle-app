import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorNotFound, ApiErrorConflict } from '../../../_cmn/error';
import { mustGetCtx } from '../../../_cmn/get_ctx';
import { UserJwtInfo } from '../../../_cmn/verify_jwt';

export default async function post(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');
  const postid = c.req.param('postid');

  const currentUserId = userJwtInfo.obj.id;

  const { data: userData, error: userError } = await spClSess
    .from('users_master')
    .select('rel_id')
    .eq('pub_id', currentUserId)
    .single(); if (userError || !userData) {
      throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

  // まず投稿へのアクセス権限を確認
  const { data: postViewData, error: postViewError } = await spClSess
    .from('views_user_post')
    .select('pub_id, privacy_allowed_posts')
    .eq('pub_id', postid)
    .single();

  if (postViewError || !postViewData || !postViewData.privacy_allowed_posts) {
    throw new ApiErrorNotFound('Post');
  }

  // アクセス権限が確認できたら、サービスロールで実際のデータ操作
  const { data: postData, error: postError } = await spClSrv
    .from('posts_master')
    .select('rel_id')
    .eq('pub_id', postid)
    .single();

  if (postError || !postData) {
    throw new ApiErrorNotFound('Post');
  }

  const { data: existingLike } = await spClSrv
    .from('posts_lines_likes')
    .select('rel_id')
    .eq('post_rel_id', postData.rel_id)
    .eq('user_rel_id', userData.rel_id)
    .single();

  if (existingLike) {
    throw new ApiErrorConflict('Like already exists');
  }

  const { error: insertError } = await spClSrv
    .from('posts_lines_likes')
    .insert({
      post_rel_id: postData.rel_id,
      user_rel_id: userData.rel_id
    });

  if (insertError) {
    throw new ApiErrorFatal(`Failed to create like: ${insertError.message}`);
  }

  return c.json({ success: true });
}