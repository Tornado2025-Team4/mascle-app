import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorUnprocessable } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';
import { UserJwtInfo } from '../_cmn/verify_jwt';
import { processBase64Image, uploadImageToStorage } from '../_cmn/image_utils';

interface ReqBodyMention {
  offset: number;
  pub_id: string;
}

interface ReqBody {
  body: string;
  mentions?: ReqBodyMention[];
  tags?: string[];
  photos?: string[];
  status_pub_id?: string;
  exercises?: string[];
}

interface ResBody {
  pub_id: string;
  status_pub_id?: string | undefined;
}

export default async function post(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

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
  if (trimmedBody.length > 1000) {
    throw new ApiErrorUnprocessable('body', 'body must be 1000 characters or less');
  }

  const { data: userData, error: userError } = await spClSess
    .from('users_master')
    .select('rel_id')
    .eq('pub_id', currentUserId)
    .single();

  if (userError || !userData) {
    throw new ApiErrorFatal(`User not found: ${userError?.message}`);
  }

  let statusRelId: number | null = null;
  if (reqBody.status_pub_id) {
    const { data: statusData, error: statusError } = await spClSess
      .from('status_master')
      .select('rel_id')
      .eq('pub_id', reqBody.status_pub_id)
      .single();

    if (statusError || !statusData) {
      throw new ApiErrorUnprocessable('status_pub_id', 'Invalid status reference');
    }
    statusRelId = statusData.rel_id;
  }

  const pubId = nanoid(21);

  const { data: postData, error: insertError } = await spClSess
    .from('posts_master')
    .insert({
      pub_id: pubId,
      posted_user_rel_id: userData.rel_id,
      body: trimmedBody,
      status_rel_id: statusRelId
    })
    .select('rel_id')
    .single();

  if (insertError || !postData) {
    throw new ApiErrorFatal(`Failed to create post: ${insertError?.message}`);
  }

  if (reqBody.mentions && reqBody.mentions.length > 0) {
    const mentionInserts = [];
    for (const mention of reqBody.mentions) {
      const { data: mentionUser, error: mentionError } = await spClSess
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
      const { error: mentionInsertError } = await spClSess
        .from('posts_lines_body_mentions')
        .insert(mentionInserts);

      if (mentionInsertError) {
        throw new ApiErrorFatal(`Failed to create mentions: ${mentionInsertError.message}`);
      }
    }
  }

  if (reqBody.tags && reqBody.tags.length > 0) {
    const tagInserts = [];
    for (const tagPubId of reqBody.tags) {
      const { data: tagData, error: tagError } = await spClSess
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
      const { error: tagInsertError } = await spClSess
        .from('posts_lines_tags')
        .insert(tagInserts);

      if (tagInsertError) {
        throw new ApiErrorFatal(`Failed to create tags: ${tagInsertError.message}`);
      }
    }
  }

  // 写真アップロード処理
  if (reqBody.photos && reqBody.photos.length > 0) {
    const photoInserts = [];
    for (let i = 0; i < reqBody.photos.length; i++) {
      const photoBase64 = reqBody.photos[i];

      try {
        // 新しいユーティリティ関数を使用
        const { buffer, contentType, extension } = processBase64Image(photoBase64, 10 * 1024 * 1024);

        // Supabaseストレージにアップロード
        const { fileId } = await uploadImageToStorage(
          spClSess,
          'posts_photos',
          buffer,
          contentType,
          extension
        );

        photoInserts.push({
          post_rel_id: postData.rel_id,
          photo_rel_id: fileId,
          photo_thumb_rel_id: fileId, // サムネイルは同じファイルを使用
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Unknown error processing photo ${i + 1}`;
        throw new ApiErrorUnprocessable('photos', errorMessage);
      }
    }

    if (photoInserts.length > 0) {
      const { error: photoInsertError } = await spClSess
        .from('posts_lines_photos')
        .insert(photoInserts);

      if (photoInsertError) {
        throw new ApiErrorFatal(`Failed to create photos: ${photoInsertError.message}`);
      }
    }
  }

  // 注意: exercisesフィールドは将来的な拡張用として残していますが、
  // 現在はトレーニング記録(status)が既にメニューを持っているため、
  // 投稿作成時に新たにメニューを作成・紐づけする処理は行いません。
  // トレーニング記録は既存のstatus_pub_idを通じて参照してください。
  let createdStatusPubId: string | undefined;

  if (reqBody.exercises && reqBody.exercises.length > 0) {
    // exercisesフィールドが送信された場合は警告ログを出力
    console.warn('Exercises field is provided but not processed. Use existing status with menus instead.');
  }

  const response: ResBody = {
    pub_id: pubId,
    status_pub_id: createdStatusPubId
  };

  return c.json(response);
}