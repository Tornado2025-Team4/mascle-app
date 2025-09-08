import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorUnprocessable, ApiErrorNotFound, ApiErrorForbidden } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { UserJwtInfo } from '../../_cmn/verify_jwt';

interface ReqBodyMention {
  offset: number;
  pub_id: string;
}

interface ReqBody {
  body?: string;
  mentions?: ReqBodyMention[];
  tags?: string[];
  status_pub_id?: string | null;
}

export default async function patch(c: Context) {
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
    .select('rel_id, posted_user_rel_id')
    .eq('pub_id', postid)
    .single();

  if (postError || !postData) {
    throw new ApiErrorNotFound('Post');
  }

  if (postData.posted_user_rel_id !== userData.rel_id) {
    throw new ApiErrorForbidden('Post modification');
  }

  const updateData: Record<string, unknown> = {};

  if (reqBody.body !== undefined) {
    if (typeof reqBody.body !== 'string' || reqBody.body.trim().length === 0) {
      throw new ApiErrorUnprocessable('body', 'body must be a non-empty string');
    }

    const trimmedBody = reqBody.body.trim();
    if (trimmedBody.length > 1000) {
      throw new ApiErrorUnprocessable('body', 'body must be 1000 characters or less');
    }

    updateData.body = trimmedBody;
  }

  if (reqBody.status_pub_id !== undefined) {
    if (reqBody.status_pub_id === null) {
      updateData.status_rel_id = null;
    } else {
      const { data: statusData, error: statusError } = await spClSrv
        .from('status_master')
        .select('rel_id')
        .eq('pub_id', reqBody.status_pub_id)
        .single();

      if (statusError || !statusData) {
        throw new ApiErrorUnprocessable('status_pub_id', 'Invalid status reference');
      }
      updateData.status_rel_id = statusData.rel_id;
    }
  }

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await spClSrv
      .from('posts_master')
      .update(updateData)
      .eq('rel_id', postData.rel_id);

    if (updateError) {
      throw new ApiErrorFatal(`Failed to update post: ${updateError.message}`);
    }
  }

  if (reqBody.mentions !== undefined) {
    const { error: deleteMentionsError } = await spClSrv
      .from('posts_lines_body_mentions')
      .delete()
      .eq('post_rel_id', postData.rel_id);

    if (deleteMentionsError) {
      throw new ApiErrorFatal(`Failed to delete mentions: ${deleteMentionsError.message}`);
    }

    if (reqBody.mentions.length > 0) {
      const mentionInserts = [];
      for (const mention of reqBody.mentions) {
        const { data: mentionUser, error: mentionError } = await spClSrv
          .from('users_master')
          .select('rel_id')
          .eq('pub_id', mention.pub_id)
          .single();

        if (!mentionError && mentionUser) {
          mentionInserts.push({
            post_rel_id: postData.rel_id,
            target_user_rel_id: mentionUser.rel_id,
            offset_num: mention.offset
          });
        }
      }

      if (mentionInserts.length > 0) {
        const { error: mentionInsertError } = await spClSrv
          .from('posts_lines_body_mentions')
          .insert(mentionInserts);

        if (mentionInsertError) {
          throw new ApiErrorFatal(`Failed to create mentions: ${mentionInsertError.message}`);
        }
      }
    }
  }

  if (reqBody.tags !== undefined) {
    const { error: deleteTagsError } = await spClSrv
      .from('posts_lines_tags')
      .delete()
      .eq('post_rel_id', postData.rel_id);

    if (deleteTagsError) {
      throw new ApiErrorFatal(`Failed to delete tags: ${deleteTagsError.message}`);
    }

    if (reqBody.tags.length > 0) {
      const tagInserts = [];
      for (const tagPubId of reqBody.tags) {
        const { data: tagData, error: tagError } = await spClSrv
          .from('tags_master')
          .select('rel_id')
          .eq('pub_id', tagPubId)
          .single();

        if (!tagError && tagData) {
          tagInserts.push({
            post_rel_id: postData.rel_id,
            tag_rel_id: tagData.rel_id
          });
        }
      }

      if (tagInserts.length > 0) {
        const { error: tagInsertError } = await spClSrv
          .from('posts_lines_tags')
          .insert(tagInserts);

        if (tagInsertError) {
          throw new ApiErrorFatal(`Failed to create tags: ${tagInsertError.message}`);
        }
      }
    }
  }

  return c.json({ success: true });
}