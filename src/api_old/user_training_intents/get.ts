/**
 * GET /user_training_intents
 *
 * Query Parameters:
 * - name?: string - インテント名での前方一致検索
 * - ids?: string[] - インテントのpub_idのリスト
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 *
 * Response:
 * Record<string, string> - { pub_id: intent }
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

    let query = spClAnon.from('user_training_intents_master').select('pub_id,intent');
    if (name) {
        query = query.ilike('intent', `${name}%`);
    }
    if (ids && ids.length > 0) {
        query = query.in('pub_id', ids);
    }
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
        await FatalErrorHandler(c, error, "fetching user training intents");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const result: Record<string, string> = {};
    for (const row of data ?? []) {
        result[row.pub_id] = row.intent;
    }
    return c.json(result);
}
