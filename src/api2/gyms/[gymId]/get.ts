/**
 * GET /gyms/:gymId
 *
 * Path Parameters:
 * - gymId: string - ジムのpub_id
 *
 * Query Parameters:
 * - resolve_photo_url?: boolean - 写真の署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * {
 *   name: string;
 *   chain_pub_id: string | null;
 *   chain_internal_id: unknown;
 *   location: unknown;
 *   photo: string | null;
 *   photo_path: string | null;
 *   photo_url?: string | null;
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

    const gymId = c.req.param('gymId');
    const resolvePhotoUrl = c.req.query('resolve_photo_url') === 'true';

    const { data, error } = await spClAnon
        .from('gym_master')
        .select(`
            name,
            gym_chain_rel_id,
            gym_chain_internal_id,
            location,
            photo,
            photo.photo_path,
            gym_chain_master(pub_id)
        `)
        .eq('pub_id', gymId)
        .single();

    if (error || !data) {
        return new ApiErrorNotFound('Gym').into_resp(c);
    }

    let photo_url: string | null = null;
    if (resolvePhotoUrl && data.photo && data.photo_path) {
        const bucket = 'gyms_photos';
        const photoPath = Array.isArray(data.photo_path) ? data.photo_path.join('/') : data.photo_path;
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

    return c.json({
        name: data.name,
        chain_pub_id: data.gym_chain_master?.pub_id || null,
        chain_internal_id: data.gym_chain_internal_id,
        location: data.location,
        photo: data.photo,
        photo_path: data.photo_path,
        photo_url: resolvePhotoUrl ? photo_url : undefined
    });
}
