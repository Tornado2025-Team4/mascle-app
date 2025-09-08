import { Context } from 'hono';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { ApiErrorFatal, ApiErrorNotFound, ApiErrorBadRequest, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

interface reqBody {
  body: string;
  sent_at?: string;
  mentions?: Array<{
    offset: number;
    pub_id: string;
  }>;
  reply_to?: string;
}

interface respBody {
  pub_id: string;
}

export default async function post(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

  const dmid = c.req.param('dmid');
  if (!dmid) {
    throw new ApiErrorNotFound('DM pair not found');
  }

  let reqBody: reqBody;
  try {
    reqBody = await c.req.json();
  } catch {
    throw new ApiErrorBadRequest('Invalid JSON body');
  }

  if (!reqBody.body || typeof reqBody.body !== 'string' || reqBody.body.trim().length === 0) {
    throw new ApiErrorBadRequest('body is required and must be a non-empty string');
  }

  const trimmedBody = reqBody.body.trim();
  if (trimmedBody.length > 1000) {
    throw new ApiErrorBadRequest('body must be 1000 characters or less');
  }

  const currentUserId = userJwtInfo.obj.id;

  const { data: currentUserData, error: currentUserError } = await spClSess
    .from('users_master')
    .select('rel_id')
    .eq('auth_id', currentUserId)
    .single();

  if (currentUserError || !currentUserData) {
    throw new ApiErrorFatal('Failed to get current user data');
  }

  const { data: pairData, error: pairError } = await spClSess
    .from('dm_pairs_master')
    .select('rel_id, user_a_rel_id, user_b_rel_id, user_a_allowed, user_b_allowed')
    .eq('pub_id', dmid)
    .single();

  if (pairError || !pairData) {
    throw new ApiErrorNotFound('DM pair not found');
  }

  const isUserA = pairData.user_a_rel_id === currentUserData.rel_id;
  const isUserB = pairData.user_b_rel_id === currentUserData.rel_id;

  if (!isUserA && !isUserB) {
    throw new ApiErrorNotFound('DM pair not found');
  }

  if (!pairData.user_a_allowed || !pairData.user_b_allowed) {
    throw new ApiErrorForbidden('DM pair is not allowed for messaging');
  }

  const messagePubId = nanoid();
  const sentAt = reqBody.sent_at ? new Date(reqBody.sent_at) : new Date();

  const { data: newMessage, error: insertError } = await spClSess
    .from('dm_pair_messages_master')
    .insert({
      pub_id: messagePubId,
      dm_pair_rel_id: pairData.rel_id,
      sent_user_rel_id: currentUserData.rel_id,
      sent_at: sentAt.toISOString(),
      body: trimmedBody
    })
    .select('rel_id')
    .single();

  if (insertError || !newMessage) {
    throw new ApiErrorFatal('Failed to create message');
  }

  if (reqBody.mentions && reqBody.mentions.length > 0) {
    const mentionInserts = [];
    for (const mention of reqBody.mentions) {
      const { data: mentionUserData } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', mention.pub_id)
        .single();

      if (mentionUserData) {
        mentionInserts.push({
          message_rel_id: newMessage.rel_id,
          target_user_rel_id: mentionUserData.rel_id,
          offset_num: mention.offset
        });
      }
    }

    if (mentionInserts.length > 0) {
      await spClSess
        .from('dm_pair_messages_lines_mentions')
        .insert(mentionInserts);
    }
  }

  if (reqBody.reply_to) {
    const { data: replyToMessage } = await spClSess
      .from('dm_pair_messages_master')
      .select('rel_id')
      .eq('pub_id', reqBody.reply_to)
      .eq('dm_pair_rel_id', pairData.rel_id)
      .single();

    if (replyToMessage) {
      await spClSess
        .from('dm_pair_messages_line_reply')
        .insert({
          message_rel_id: newMessage.rel_id,
          target_message_rel_id: replyToMessage.rel_id
        });
    }
  }

  return c.json({ pub_id: messagePubId } as respBody);
}