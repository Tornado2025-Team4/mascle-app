import { Context } from 'hono';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { ApiErrorFatal, ApiErrorNotFound } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqQuery {
  limit?: number;
  before?: string;
  after?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
  const limitRaw = c.req.query('limit');
  const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;
  const before = c.req.query('before');
  const after = c.req.query('after');

  return { limit, before, after };
};

interface respBody {
  messages: Array<{
    body: string;
    sent_at: string;
    mentions: Array<{
      offset: number;
      pub_id: string;
      handle: string;
      display_name: string;
      description: string | null;
      tags: Array<{
        pub_id: string;
        name: string;
      }>;
      icon_url: string | null;
      skill_level: string | null;
      followings_count: number;
      followers_count: number;
    }>;
    reply_to?: string;
  }>;
}

export default async function get(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

  const dmid = c.req.param('dmid');
  const query = parseReqQuery(c);

  if (!dmid) {
    throw new ApiErrorNotFound('DM pair not found');
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
    .select('rel_id, user_a_rel_id, user_b_rel_id')
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

  let messagesQuery = spClSess
    .from('dm_pair_messages_master')
    .select(`
            body,
            sent_at,
            pub_id,
            dm_pair_messages_lines_mentions (
                offset_num,
                target_user_rel_id
            ),
            dm_pair_messages_line_reply (
                target_message_rel_id
            )
        `)
    .eq('dm_pair_rel_id', pairData.rel_id)
    .order('sent_at', { ascending: false })
    .limit(query.limit!);

  if (query.before) {
    messagesQuery = messagesQuery.lt('sent_at', query.before);
  }

  if (query.after) {
    messagesQuery = messagesQuery.gt('sent_at', query.after);
  }

  const { data: messagesData, error: messagesError } = await messagesQuery;

  if (messagesError) {
    throw new ApiErrorFatal('Failed to get messages');
  }

  const messages = await Promise.all((messagesData || []).map(async message => {
    const mentions = await Promise.all(
      (message.dm_pair_messages_lines_mentions || []).map(async mention => {
        const { data: userData } = await spClSess
          .from('users_master')
          .select(`
                        pub_id,
                        handle,
                        display_name,
                        description,
                        icon_url,
                        skill_level,
                        followings_count,
                        followers_count,
                        user_tags (
                            tag:tag_rel_id (
                                pub_id,
                                name
                            )
                        )
                    `)
          .eq('rel_id', mention.target_user_rel_id)
          .single();

        return {
          offset: mention.offset_num,
          pub_id: userData?.pub_id || '',
          handle: userData?.handle || '',
          display_name: userData?.display_name || '',
          description: userData?.description || null,
          tags: (userData?.user_tags || []).map((ut: any) => ({
            pub_id: ut.tag.pub_id,
            name: ut.tag.name
          })),
          icon_url: userData?.icon_url || null,
          skill_level: userData?.skill_level || null,
          followings_count: userData?.followings_count || 0,
          followers_count: userData?.followers_count || 0
        };
      })
    );

    let reply_to;
    if (message.dm_pair_messages_line_reply?.[0]) {
      const { data: replyToMessage } = await spClSess
        .from('dm_pair_messages_master')
        .select('pub_id')
        .eq('rel_id', message.dm_pair_messages_line_reply[0].target_message_rel_id)
        .single();
      reply_to = replyToMessage?.pub_id;
    }

    return {
      body: message.body,
      sent_at: message.sent_at,
      mentions,
      reply_to
    };
  }));

  return c.json({ messages } as respBody);
}