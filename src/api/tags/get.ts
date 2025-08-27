/**
 * GET /user_tags
 *
 * Query Parameters:
 * - name?: string - タグ名での部分一致検索（idsと排他的）
 * - ids?: string[] - タグのpub_idのリスト（nameと排他的）
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 *
 * Response:
 * Record<string, string> - { pub_id: tag_name }
 */

import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorUnprocessable } from '../_cmn/error';
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

    if (!name && (!ids || ids.length === 0)) {
        throw new ApiErrorUnprocessable('query', 'name or ids is required');
    }

    return { name, ids, limit } as reqQuery;
};

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = spClAnon.from('tags_master').select('pub_id,name');
    if (rq.name) {
        query = query.ilike('name', `%${rq.name}%`);
    }
    if (rq.ids && 0 < rq.ids.length) {
        query = query.in('pub_id', rq.ids);
    }
    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch tags ${error.message}`);
    }

    const result: Record<string, string> = {};
    for (const row of data ?? []) {
        result[row.pub_id] = row.name;
    }

    return c.json(result);
}
