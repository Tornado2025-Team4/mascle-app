import { Context } from 'hono';
import { ApiErrorFatal } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqQuery {
    name?: string;
    ids?: string[];
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const name = c.req.query('name');
    const ids = c.req.queries('ids');
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    return { name, ids, limit } as reqQuery;
};

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = spClAnon.from('intents_master').select('pub_id,intent');
    if (rq.name) {
        query = query.ilike('intent', `%${rq.name}%`);
    }
    if (rq.ids && 0 < rq.ids.length) {
        query = query.in('pub_id', rq.ids);
    }
    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch intents ${error.message}`);
    }

    const result: Record<string, string> = {};
    for (const row of data ?? []) {
        result[row.pub_id] = row.intent;
    }

    return c.json(result);
}
