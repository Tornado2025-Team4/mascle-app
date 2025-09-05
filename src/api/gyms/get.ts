import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorBadRequest } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqQuery {
    chain_id?: string;
    name?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const chain_id = c.req.query('chain_id');
    const name = c.req.query('name');
    const latRaw = c.req.query('lat');
    const lngRaw = c.req.query('lng');
    const radiusRaw = c.req.query('radius');
    const limitRaw = c.req.query('limit');

    const lat = latRaw ? Number(latRaw) : undefined;
    const lng = lngRaw ? Number(lngRaw) : undefined;
    const radius = radiusRaw ? Number(radiusRaw) : undefined;
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    const hasLocationParams = lat !== undefined || lng !== undefined || radius !== undefined;
    const hasAllLocationParams = lat !== undefined && lng !== undefined && radius !== undefined;

    if (hasLocationParams && !hasAllLocationParams) {
        throw new ApiErrorBadRequest('Location parameters', 'lat, lng, and radius must all be provided together');
    }

    return { chain_id, name, lat, lng, radius, limit } as reqQuery;
};

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = spClAnon
        .from('gyms_master')
        .select(`
            pub_id,
            name,
            photo_rel_id,
            location,
            gymchain_rel_id,
            gymchain_internal_id
        `);

    if (rq.name) {
        query = query.ilike('name', `%${rq.name}%`);
    }

    if (rq.lat !== undefined && rq.lng !== undefined && rq.radius !== undefined) {
        query = query.filter('location', 'dwithin', `{"type":"Point","coordinates":[${rq.lng},${rq.lat}]},${rq.radius}`);
    }

    query = query.limit(rq.limit);

    const { data: gymsData, error: gymsError } = await query;
    if (gymsError) {
        throw new ApiErrorFatal(`failed to fetch gyms ${gymsError.message}`);
    }

    if (!gymsData || gymsData.length === 0) {
        return c.json([]);
    }

    const gymchainRelIds = [...new Set(gymsData.map(gym => gym.gymchain_rel_id).filter(Boolean))];
    let gymchainsData: Array<{ rel_id: number, pub_id: string, name: string, icon_rel_id: string | null }> = [];

    if (gymchainRelIds.length > 0) {
        let gymchainsQuery = spClAnon
            .from('gymchains_master')
            .select('rel_id, pub_id, name, icon_rel_id')
            .in('rel_id', gymchainRelIds);

        if (rq.chain_id) {
            gymchainsQuery = gymchainsQuery.eq('pub_id', rq.chain_id);
        }

        const { data, error } = await gymchainsQuery;
        if (error) {
            throw new ApiErrorFatal(`failed to fetch gymchains ${error.message}`);
        }
        gymchainsData = data || [];
    }

    const gymchainsMap = new Map(gymchainsData.map(chain => [chain.rel_id, chain]));

    let filteredGyms = gymsData;
    if (rq.chain_id) {
        const validChainRelIds = new Set(gymchainsData.map(chain => chain.rel_id));
        filteredGyms = gymsData.filter(gym => gym.gymchain_rel_id && validChainRelIds.has(gym.gymchain_rel_id));
    }

    const result = filteredGyms.map(row => {
        const chain = row.gymchain_rel_id ? gymchainsMap.get(row.gymchain_rel_id) : null;
        return {
            pub_id: row.pub_id,
            name: row.name,
            photo_url: row.photo_rel_id ? `/api/storage/photos/${row.photo_rel_id}` : null,
            chain: chain ? {
                pub_id: chain.pub_id,
                name: chain.name,
                icon_url: chain.icon_rel_id ? `/api/storage/icons/${chain.icon_rel_id}` : null,
                internal_id: row.gymchain_internal_id
            } : null
        };
    });

    return c.json(result);
}
