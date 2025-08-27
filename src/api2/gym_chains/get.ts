/**
 * GET /gym_chains
 *
 * Query Parameters:
 * - name?: string - ジムチェーン名での部分一致検索
 * - resolve_icon_url?: boolean - アイコンの署名URLを生成するかどうか（デフォルト: false）
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 *
 * Response:
 * Record<string, {
 *   name: string;
 *   icon: string | null;
 *   icon_path?: string | null;
 *   icon_url?: string | null;
 * }>
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
    const resolveIconUrl = c.req.query('resolve_icon_url') === 'true';
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    let query = spClAnon.from('gym_chain_master').select('pub_id, name, icon, icon.icon_path')
        .order('name')
        .limit(limit);

    if (name) {
        query = query.ilike('name', `%${name}%`);
    }

    const { data, error } = await query;
    if (error) {
        await FatalErrorHandler(c, error, "fetching gym chains");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!data || data.length === 0) return c.json({});

    const result: Record<string, {
        name: string;
        icon: string | null;
        icon_path?: string | null;
        icon_url?: string | null;
    }> = {};

    for (const row of data) {
        let icon_url: string | null = null;
        if (resolveIconUrl && row.icon && row.icon_path) {
            const bucket = 'gym_chains_icons';
            const iconPath = Array.isArray(row.icon_path) ? row.icon_path.join('/') : row.icon_path;
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClAnon.storage
                    .from(bucket)
                    .createSignedUrl(iconPath, 60 * 60);
                if (signedUrlError) {
                    await FatalErrorHandler(c, signedUrlError, "creating signed URL for gym chain icon");
                    return new ApiErrorInternalServerError().into_resp(c);
                }
                icon_url = signedUrlData?.signedUrl || null;
            } catch (e) {
                await FatalErrorHandler(c, e, "exception creating signed URL for gym chain icon");
                return new ApiErrorInternalServerError().into_resp(c);
            }
        }

        result[row.pub_id] = {
            name: row.name,
            icon: row.icon,
            icon_path: row.icon_path,
            icon_url: resolveIconUrl ? icon_url : undefined
        };
    }

    return c.json(result);
}
