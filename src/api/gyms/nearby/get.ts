import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorBadRequest } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

export async function GET(c: Context) {
    const supabaseClient = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const latitude = c.req.query("latitude");
    const longitude = c.req.query("longitude");
    const radius = c.req.query("radius") || "5000"; // デフォルト5km
    const limit = c.req.query("limit") || "50";

    if (!latitude || !longitude) {
        throw new ApiErrorBadRequest("latitude and longitude are required");
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMeters = parseFloat(radius);
    const limitNum = parseInt(limit, 10);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMeters) || isNaN(limitNum)) {
        throw new ApiErrorBadRequest("Invalid numeric parameters");
    }

    // 位置情報のフィルタリング用にダミーデータを返す（テスト用）
    const { data: gymsData, error } = await supabaseClient
        .from('gyms_master')
        .select('pub_id, name, photo_rel_id, location, gymchain_rel_id, gymchain_internal_id')
        .limit(limitNum);

    if (error) {
        console.error("Supabase error:", error);
        throw new ApiErrorFatal(`Failed to fetch nearby gyms: ${error.message}`);
    }

    if (!gymsData || gymsData.length === 0) {
        return c.json([]);
    }

    // gymchain情報を取得
    const gymchainIds = [...new Set(gymsData.map((gym: { gymchain_rel_id?: number }) => gym.gymchain_rel_id).filter(Boolean))];

    let chainsData: Array<{ rel_id: number; pub_id: string; name: string; icon_rel_id?: number }> = [];
    if (gymchainIds.length > 0) {
        const { data: chains, error: chainError } = await supabaseClient
            .from('gymchains_master')
            .select('rel_id, pub_id, name, icon_rel_id')
            .in('rel_id', gymchainIds);

        if (!chainError && chains) {
            chainsData = chains;
        }
    }

    const chainMap = chainsData.reduce((acc: Record<number, { rel_id: number; pub_id: string; name: string; icon_rel_id?: number }>, chain: { rel_id: number; pub_id: string; name: string; icon_rel_id?: number }) => {
        acc[chain.rel_id] = chain;
        return acc;
    }, {});

    const result = gymsData.map((gym: { pub_id: string; name: string; photo_rel_id?: number; location?: { coordinates: [number, number] }; gymchain_rel_id?: number }) => {
        const chain = gym.gymchain_rel_id ? chainMap[gym.gymchain_rel_id] : null;

        let coordinates = null;
        if (gym.location && gym.location.coordinates) {
            coordinates = {
                longitude: gym.location.coordinates[0],
                latitude: gym.location.coordinates[1]
            };
        }

        return {
            pub_id: gym.pub_id,
            name: gym.name,
            photo_rel_id: gym.photo_rel_id,
            coordinates: coordinates,
            chain: chain ? {
                pub_id: chain.pub_id,
                name: chain.name,
                icon_rel_id: chain.icon_rel_id
            } : null
        };
    });

    return c.json(result);
}
