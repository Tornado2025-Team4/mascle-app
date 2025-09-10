import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorNotFound } from '../../../_cmn/error';
import { mustGetCtx } from '../../../_cmn/get_ctx';

interface reqQuery {
  limit: number;
  offset: number;
  before_commented_at?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
  const limitRaw = c.req.query('limit');
  const offsetRaw = c.req.query('offset');
  const before_commented_at = c.req.query('before_commented_at');

  const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;
  const offset = offsetRaw ? Math.max(Number(offsetRaw), 0) : 0;

  return { limit, offset, before_commented_at } as reqQuery;
};

export default async function get(c: Context) {
  const spClSess = c.get('supabaseClientSess') as SupabaseClient | null;
  const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
  const postid = c.req.param('postid');

  const rq = parseReqQuery(c);

  // まず投稿へのアクセス権限を確認
  const { data: postViewData, error: postViewError } = await (spClSess || spClAnon)
    .from('views_user_post')
    .select('pub_id, privacy_allowed_posts')
    .eq('pub_id', postid)
    .single();

  if (postViewError || !postViewData || !postViewData.privacy_allowed_posts) {
    throw new ApiErrorNotFound('Post');
  }

  let query = (spClSess || spClAnon)
    .from('views_user_post_comments')
    .select('*')
    .eq('post_pub_id', postid)
    .order('commented_at', { ascending: false });

  if (rq.before_commented_at) {
    query = query.lt('commented_at', rq.before_commented_at);
  }

  query = query.range(rq.offset, rq.offset + rq.limit - 1);

  const { data, error } = await query;
  if (error) {
    throw new ApiErrorFatal(`failed to fetch comments: ${error.message}`);
  }

  const result = (data ?? [])
    .filter(row => row.privacy_allowed_posts) // プライバシー権限があるもののみ
    .map(row => ({
      pub_id: row.pub_id,
      post_pub_id: row.post_pub_id,
      user: row.user_summary,
      commented_at: new Date(row.commented_at).toISOString(),
      body: row.body,
      mentions: row.mentions || []
    }));

  return c.json(result);
}