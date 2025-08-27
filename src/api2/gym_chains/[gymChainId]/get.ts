/**
 * GET /gym_chains/:gymChainId
 *
 * Path Parameters:
 * - gymChainId: string - ジムチェーンのpub_id
 *
 * Query Parameters:
 * - resolve_icon_url?: boolean - アイコンの署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * {
 *   name: string;
 *   icon: string | null;
 *   icon_path: string | null;
 *   icon_url?: string | null;
 * }
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '../../_cmn/error';

export default async function get(c: Context) {
    const spClAnon = c.get('supabaseClientAnon');
    if (!spClAnon) {
        await FatalErrorHandler(c, "supabaseClientAnon not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const gymChainId = c.req.param('gymChainId');
    const resolveIconUrl = c.req.query('resolve_icon_url') === 'true';

    const { data, error } = await spClAnon
        .from('gym_chain_master')
        .select('name, icon, icon.icon_path')
        .eq('pub_id', gymChainId)
        .single();

    if (error || !data) {
        return new ApiErrorNotFound('GymChain').into_resp(c);
    }

    let icon_url: string | null = null;
    if (resolveIconUrl && data.icon && data.icon_path) {
        const bucket = 'gym_chains_icons';
        const iconPath = Array.isArray(data.icon_path) ? data.icon_path.join('/') : data.icon_path;
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

    return c.json({
        name: data.name,
        icon: data.icon,
        icon_path: data.icon_path,
        icon_url: resolveIconUrl ? icon_url : undefined
    });
}
