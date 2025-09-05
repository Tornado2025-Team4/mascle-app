import { Context } from 'hono';
import { ApiErrorFatal } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqQuery {
    name?: string;
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const name = c.req.query('name');
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    return { name, limit } as reqQuery;
};

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = spClAnon
        .from('gymchains_master')
        .select('pub_id, name, icon_rel_id');

    if (rq.name) {
        query = query.ilike('name', `%${rq.name}%`);
    }

    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch gymchains ${error.message}`);
    }

    const result = (data ?? []).map(row => ({
        pub_id: row.pub_id,
        name: row.name,
        icon_url: row.icon_rel_id ? `/api/storage/icons/${row.icon_rel_id}` : null
    }));

    return c.json(result);
}
