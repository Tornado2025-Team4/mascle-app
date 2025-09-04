
/**
 * GET /user_training_intent_body_parts
 *
 * Query Parameters:
 * - name?: string - 部位名での部分一致検索
 * - ids?: string[] - 部位のpub_idのリスト
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 *
 * Response:
 * Record<string, string> - { pub_id: body_part }
 */

import { Context } from 'hono';
import { ApiErrorInternalServerError, FatalErrorHandler } from '../_cmn/error';

export default async function get(c: Context) {
    const spClAnon = c.get('supabaseClientAnon');
    if (!spClAnon) {
        await FatalErrorHandler(c, "supabaseClientAnon not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const name = c.req.query('name');
    const ids = c.req.queries('ids');
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    let query = spClAnon.from('user_training_intent_body_parts_master').select('pub_id,body_part');
    if (name) {
        query = query.ilike('body_part', `%${name}%`);
    }
    if (ids && ids.length > 0) {
        query = query.in('pub_id', ids);
    }
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
        await FatalErrorHandler(c, error, "fetching user training intent body parts");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const result: Record<string, string> = {};
    for (const row of data ?? []) {
        result[row.pub_id] = row.body_part;
    }
    return c.json(result);
}
