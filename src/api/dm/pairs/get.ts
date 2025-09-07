import { Context } from 'hono';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqQuery {
  limit?: number;
  messaged_after?: string;
  messaged_before?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
  const limitRaw = c.req.query('limit');
  const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;
  const messaged_after = c.req.query('messaged_after');
  const messaged_before = c.req.query('messaged_before');

  return { limit, messaged_after, messaged_before };
};

interface respBody {
  pairs: Array<{
    partner_pub_id: string;
    partner_allowed: boolean;
    latest_message?: {
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
    };
  }>;
}

export default async function get(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

  const query = parseReqQuery(c);

  const currentUserId = userJwtInfo.obj.id;

  const { data: currentUserData, error: currentUserError } = await spClSess
    .from('users_master')
    .select('rel_id')
    .eq('auth_id', currentUserId)
    .single();

  if (currentUserError || !currentUserData) {
    throw new ApiErrorFatal('Failed to get current user data');
  }

  const { data: pairsData, error: pairsError } = await spClSess
    .from('dm_pairs_master')
    .select(`
            rel_id,
            user_a_rel_id,
            user_b_rel_id,
            user_a_allowed,
            user_b_allowed,
            created_at,
            user_a:user_a_rel_id (
                rel_id,
                pub_id,
                handle,
                display_name,
                description,
                icon_url,
                skill_level,
                followings_count,
                followers_count
            ),
            user_b:user_b_rel_id (
                rel_id,
                pub_id,
                handle,
                display_name,
                description,
                icon_url,
                skill_level,
                followings_count,
                followers_count
            )
        `)
    .or(`user_a_rel_id.eq.${currentUserData.rel_id},user_b_rel_id.eq.${currentUserData.rel_id}`)
    .order('created_at', { ascending: false })
    .limit(query.limit!);

  if (pairsError) {
    throw new ApiErrorFatal('Failed to get DM pairs');
  }

  const pairs = await Promise.all((pairsData || []).map(async pair => {
    const isUserA = pair.user_a_rel_id === currentUserData.rel_id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partner = (isUserA ? pair.user_b : pair.user_a) as any;
    const partnerAllowed = isUserA ? pair.user_b_allowed : pair.user_a_allowed;

    const { data: latestMessage } = await spClSess
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
      .eq('dm_pair_rel_id', pair.rel_id)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    let latestMessageFormatted;
    if (latestMessage) {
      const mentions = await Promise.all(
        (latestMessage.dm_pair_messages_lines_mentions || []).map(async mention => {
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
            tags: [],
            icon_url: userData?.icon_url || null,
            skill_level: userData?.skill_level || null,
            followings_count: userData?.followings_count || 0,
            followers_count: userData?.followers_count || 0
          };
        })
      );

      let reply_to;
      if (latestMessage.dm_pair_messages_line_reply?.[0]) {
        const { data: replyToMessage } = await spClSess
          .from('dm_pair_messages_master')
          .select('pub_id')
          .eq('rel_id', latestMessage.dm_pair_messages_line_reply[0].target_message_rel_id)
          .single();
        reply_to = replyToMessage?.pub_id;
      }

      latestMessageFormatted = {
        body: latestMessage.body,
        sent_at: latestMessage.sent_at,
        mentions,
        reply_to
      };
    }

    return {
      partner_pub_id: partner.pub_id,
      partner_allowed: partnerAllowed,
      latest_message: latestMessageFormatted
    };
  }));

  return c.json({ pairs } as respBody);
}