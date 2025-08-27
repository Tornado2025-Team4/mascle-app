/**
 * GET /gyms
 *
 * Query Parameters:
 * - chain_id?: string - ジムチェーンのpub_idでフィルタ
 * - name?: string - ジム名での部分一致検索
 * - lat?: number - 緯度（lng, radiusと併用必須）
 * - lng?: number - 経度（lat, radiusと併用必須）
 * - radius?: number - 検索半径（メートル、lat, lngと併用必須）
 * - resolve_photo_url?: boolean - 写真の署名URLを生成するかどうか（デフォルト: false）
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 *
 * Response:
 * Record<string, {
 *   name: string;
 *   chain_pub_id: string | null;
 *   chain_internal_id: unknown;
 *   location: unknown;
 *   photo: string | null;
 *   photo_path?: string | null;
 *   photo_url?: string | null;
 * }>
 */

import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorInternalServerError, FatalErrorHandler } from '../_cmn/error';

export default async function get(c: Context) {
    const spClAnon = c.get('supabaseClientAnon');
    if (!spClAnon) {
        await FatalErrorHandler(c, "supabaseClientAnon not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const chainId = c.req.query('chain_id');
    const name = c.req.query('name');
    const lat = c.req.query('lat');
    const lng = c.req.query('lng');
    const radius = c.req.query('radius');
    const resolvePhotoUrl = c.req.query('resolve_photo_url') === 'true';
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    const hasLat = !!lat;
    const hasLng = !!lng;
    const hasRadius = !!radius;
    if ((hasLat || hasLng || hasRadius) && !(hasLat && hasLng && hasRadius)) {
        return new ApiErrorBadRequest('lat, lng, radius must all be specified together').into_resp(c);
    }

    let query = spClAnon
        .from('gym_master')
        .select(`
            pub_id,
            name,
            gym_chain_rel_id,
            gym_chain_internal_id,
            location,
            photo,
            photo.photo_path,
            gym_chain_master(pub_id)
        `)
        .limit(limit);

    if (hasLat && hasLng && hasRadius) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusNum = parseFloat(radius);
        if (!isNaN(latNum) && !isNaN(lngNum) && !isNaN(radiusNum)) {
            query = query.not('location', 'is', null);
            query = query.filter('location', 'st_dwithin', `POINT(${lngNum} ${latNum})::geography, ${radiusNum}`);
        } else {
            return new ApiErrorBadRequest('lat, lng, radius must be valid numbers').into_resp(c);
        }
    }
    if (chainId) {
        query = query.eq('gym_chain_master.pub_id', chainId);
    }
    if (name) {
        query = query.ilike('name', `%${name}%`);
    }

    const { data, error } = await query;
    if (error) {
        await FatalErrorHandler(c, error, "fetching gyms");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!data || data.length === 0) return c.json({});

    const result: Record<string, {
        name: string;
        chain_pub_id: string | null;
        chain_internal_id: unknown;
        location: unknown;
        photo: string | null;
        photo_path?: string | null;
        photo_url?: string | null;
    }> = {};

    for (const row of data) {
        let photo_url: string | null = null;
        if (resolvePhotoUrl && row.photo && row.photo_path) {
            const bucket = 'gyms_photos';
            const photoPath = Array.isArray(row.photo_path) ? row.photo_path.join('/') : row.photo_path;
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClAnon.storage
                    .from(bucket)
                    .createSignedUrl(photoPath, 60 * 60);
                if (signedUrlError) {
                    await FatalErrorHandler(c, signedUrlError, "creating signed URL for gym photo");
                    return new ApiErrorInternalServerError().into_resp(c);
                }
                photo_url = signedUrlData?.signedUrl || null;
            } catch (e) {
                await FatalErrorHandler(c, e, "exception creating signed URL for gym photo");
                return new ApiErrorInternalServerError().into_resp(c);
            }
        }

        result[row.pub_id] = {
            name: row.name,
            chain_pub_id: row.gym_chain_master?.pub_id || null,
            chain_internal_id: row.gym_chain_internal_id,
            location: row.location,
            photo: row.photo,
            photo_path: row.photo_path,
            photo_url: resolvePhotoUrl ? photo_url : undefined
        };
    }

    return c.json(result);
}
