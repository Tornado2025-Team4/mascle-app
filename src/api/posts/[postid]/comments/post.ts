import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorUnprocessable, ApiErrorNotFound } from '../../../_cmn/error';
import { mustGetCtx } from '../../../_cmn/get_ctx';
import { UserJwtInfo } from '../../../_cmn/verify_jwt';

interface ReqBodyMention {
  offset: number;
  pub_id: string;
}

interface ReqBody {
  body: string;
  mentions?: ReqBodyMention[];
}

export default async function post(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');
  const postid = c.req.param('postid');

  const currentUserId = userJwtInfo.obj.id;

  let reqBody: ReqBody;
  try {
    reqBody = await c.req.json();
  } catch {
    throw new ApiErrorUnprocessable('body', 'Invalid JSON body');
  }

  if (!reqBody.body || typeof reqBody.body !== 'string' || reqBody.body.trim().length === 0) {
    throw new ApiErrorUnprocessable('body', 'body is required and must be a non-empty string');
  }

  const trimmedBody = reqBody.body.trim();
  if (trimmedBody.length > 500) {
    throw new ApiErrorUnprocessable('body', 'body must be 500 characters or less');
  }

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

  const pubId = nanoid(21);

  const { data: commentData, error: insertError } = await spClSrv
    .from('comments_master')
    .insert({
      pub_id: pubId,
      post_rel_id: postData.rel_id,
      user_rel_id: userData.rel_id,
      body: trimmedBody
    })
    .select('rel_id')
    .single();

  if (insertError || !commentData) {
    throw new ApiErrorFatal(`Failed to create comment: ${insertError?.message}`);
  }

  if (reqBody.mentions && reqBody.mentions.length > 0) {
    const mentionInserts = [];
    for (const mention of reqBody.mentions) {
      const { data: mentionUser, error: mentionError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', mention.pub_id)
        .single();

      if (!mentionError && mentionUser) {
        mentionInserts.push({
          comment_rel_id: commentData.rel_id,
          user_rel_id: mentionUser.rel_id,
          offset_num: mention.offset
        });
      }
    }

    if (mentionInserts.length > 0) {
      const { error: mentionInsertError } = await spClSrv
        .from('comments_lines_mentions')
        .insert(mentionInserts);

      if (mentionInsertError) {
        throw new ApiErrorFatal(`Failed to create mentions: ${mentionInsertError.message}`);
      }
    }
  }

  return c.json({ pub_id: pubId });
}