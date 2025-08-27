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
import { ApiErrorBadRequest, ApiErrorInternalServerError, FatalErrorHandler } from '../_cmn/error';

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

    if (!name && (!ids || ids.length === 0)) {
        return new ApiErrorBadRequest('name or ids is required').into_resp(c);
    }

    let query = spClAnon.from('user_tags_master').select('pub_id,tag_name');
    if (name) {
        query = query.ilike('tag_name', `%${name}%`);
    }
    if (ids && ids.length > 0) {
        query = query.in('pub_id', ids);
    }
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
        await FatalErrorHandler(c, error, "fetching user tags");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const result: Record<string, string> = {};
    for (const row of data ?? []) {
        result[row.pub_id] = row.tag_name;
    }
    return c.json(result);
}
