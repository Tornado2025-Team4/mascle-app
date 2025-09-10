import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';

interface reqQuery {
    user_pub_id?: string;
    limit: number;
    offset: number;
    before_posted_at?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
    const user_pub_id = c.req.query('user_pub_id');
    const limitRaw = c.req.query('limit');
    const offsetRaw = c.req.query('offset');
    const before_posted_at = c.req.query('before_posted_at');

    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;
    const offset = offsetRaw ? Math.max(Number(offsetRaw), 0) : 0;

    return { user_pub_id, limit, offset, before_posted_at } as reqQuery;
};

export default async function get(c: Context) {
    const spClSess = c.get('supabaseClientSess') as SupabaseClient | null;
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = (spClSess || spClAnon)
        .from('views_user_post')
        .select('*')
        .order('posted_at', { ascending: false });

    if (rq.user_pub_id) {
        query = query.eq('user_pub_id', rq.user_pub_id);
    }

    if (rq.before_posted_at) {
        query = query.lt('posted_at', rq.before_posted_at);
    }

    query = query.range(rq.offset, rq.offset + rq.limit - 1);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch posts: ${error.message}`);
    }

    const result = (data ?? [])
        .filter(row => row.privacy_allowed_posts) // プライバシー権限があるもののみ
        .map(row => ({
            pub_id: row.pub_id,
            posted_user: row.user_summary,
            posted_at: row.posted_at,
            body: row.body,
            mentions: row.mentions || [],
            tags: row.tags || [],
            photos: (row.photos || []).map((photo: { url_name: string; thumb_url_name: string }) => ({
                url: photo.url_name,
                thumb_url: photo.thumb_url_name
            })),
            likes_count: row.likes_count || 0,
            comments_count: row.comments_count || 0,
            status: row.status_pub_id ? { pub_id: row.status_pub_id } : null
        }));

    return c.json(result);
}
