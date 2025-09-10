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

// WKB形式のPostGISデータから緯度経度を抽出する関数
const parseWKBLocation = (wkbHex: string): { latitude: number; longitude: number } | null => {
    try {
        // WKB (Well-Known Binary) をパースして座標を取得
        // PostgreSQLのPostGISから返される16進数文字列をパース

        // WKBの構造：
        // - 先頭4バイト: エンディアン
        // - 次4バイト: ジオメトリタイプ
        // - 次4バイト: SRID
        // - X座標（8バイト double）
        // - Y座標（8バイト double）

        if (!wkbHex || wkbHex.length < 42) {
            return null;
        }

        // SRID付きポイントの場合（先頭が01010000）
        if (wkbHex.startsWith('0101000020')) {
            // X座標の開始位置（SRID後）
            const xStart = 18; // エンディアン(2) + タイプ(8) + SRID(8)
            const yStart = 34; // X座標(16) 後

            // 16進数文字列をリトルエンディアンのdoubleとして解釈
            const xHex = wkbHex.substring(xStart, xStart + 16);
            const yHex = wkbHex.substring(yStart, yStart + 16);

            // リトルエンディアンの16進数をdoubleに変換
            const xBuffer = Buffer.from(xHex, 'hex');
            const yBuffer = Buffer.from(yHex, 'hex');

            const longitude = xBuffer.readDoubleLE(0);
            const latitude = yBuffer.readDoubleLE(0);

            return { latitude, longitude };
        }

        return null;
    } catch (e) {
        console.error('Error parsing WKB location data:', e);
        return null;
    }
};

interface GymRawData {
    pub_id: string;
    name: string;
    photo_rel_id: string | null;
    location: string | object | null;
    gymchain_rel_id: number | null;
    gymchain_internal_id: { address?: string } | null;
}

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = spClAnon
        .from('gyms_master')
        .select('pub_id, name, photo_rel_id, location, gymchain_rel_id, gymchain_internal_id');

    if (rq.name) {
        query = query.ilike('name', `%${rq.name}%`);
    }

    let gymsData: GymRawData[];

    if (rq.lat !== undefined && rq.lng !== undefined && rq.radius !== undefined) {
        // PostGISの地理的検索をRPC関数で実行
        const { data: nearbyGyms, error: geoError } = await spClAnon
            .rpc('get_nearby_gyms', {
                center_lat: rq.lat,
                center_lng: rq.lng,
                radius_meters: rq.radius,
                max_results: rq.limit
            });

        if (geoError) {
            throw new ApiErrorFatal(`geographical search failed: ${geoError.message}`);
        }
        gymsData = nearbyGyms || [];
    } else {
        // 名前検索やチェーンIDフィルタのみの場合は通常のクエリ
        query = query.limit(rq.limit);
        const { data: queryResult, error: gymsError } = await query;
        if (gymsError) {
            throw new ApiErrorFatal(`failed to fetch gyms ${gymsError.message}`);
        }
        gymsData = queryResult || [];
    }

    if (!gymsData || gymsData.length === 0) {
        return c.json([]);
    }

    const gymchainRelIds = [...new Set(gymsData.map((gym: GymRawData) => gym.gymchain_rel_id).filter(Boolean))];
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
        filteredGyms = gymsData.filter((gym: GymRawData) => gym.gymchain_rel_id && validChainRelIds.has(gym.gymchain_rel_id));
    }

    const result = await Promise.all(filteredGyms.map(async (row: GymRawData) => {
        const chain = row.gymchain_rel_id ? gymchainsMap.get(row.gymchain_rel_id) : null;

        let photo_url: string | null = null;
        if (row.photo_rel_id) {
            try {
                // まず storage.objects テーブルからファイル名を取得
                const { data: storageData, error: storageError } = await spClAnon
                    .from('storage.objects')
                    .select('name')
                    .eq('id', row.photo_rel_id)
                    .single();

                if (!storageError && storageData?.name) {
                    // ファイル名を使って署名付きURLを生成
                    const { data: signedUrlData, error: signedUrlError } = await spClAnon.storage
                        .from('gyms_photos')
                        .createSignedUrl(storageData.name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        photo_url = signedUrlData.signedUrl;
                    }
                }
            } catch (e) {
                console.error('Failed to create signed URL for gym photo:', e);
            }
        }

        let chainWithIcon = null;
        if (chain) {
            let icon_url: string | null = null;
            if (chain.icon_rel_id) {
                try {
                    // まず storage.objects テーブルからファイル名を取得
                    const { data: storageData, error: storageError } = await spClAnon
                        .from('storage.objects')
                        .select('name')
                        .eq('id', chain.icon_rel_id)
                        .single();

                    if (!storageError && storageData?.name) {
                        // ファイル名を使って署名付きURLを生成
                        const { data: signedUrlData, error: signedUrlError } = await spClAnon.storage
                            .from('gymchains_icons')
                            .createSignedUrl(storageData.name, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            icon_url = signedUrlData.signedUrl;
                        }
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for gymchain icon:', e);
                }
            }

            chainWithIcon = {
                pub_id: chain.pub_id,
                name: chain.name,
                icon_url,
                internal_id: row.gymchain_internal_id
            };
        }

        // PostGISの位置データを解析（WKB形式またはGeoJSON形式）
        let latitude: number | null = null;
        let longitude: number | null = null;

        if (row.location) {
            try {
                // 文字列で16進数形式（WKB）の場合
                if (typeof row.location === 'string' && row.location.match(/^[0-9A-Fa-f]+$/)) {
                    const coords = parseWKBLocation(row.location);
                    if (coords) {
                        latitude = coords.latitude;
                        longitude = coords.longitude;
                    }
                } else {
                    // GeoJSON形式の場合
                    const locationData = typeof row.location === 'string'
                        ? JSON.parse(row.location)
                        : row.location;

                    if (locationData && locationData.type === 'Point' && locationData.coordinates) {
                        longitude = locationData.coordinates[0]; // GeoJSONでは[lng, lat]の順序
                        latitude = locationData.coordinates[1];
                    }
                }
            } catch (e) {
                console.error('Error parsing location data:', e, row.location);
            }
        }

        return {
            pub_id: row.pub_id,
            name: row.name,
            photo_url,
            chain: chainWithIcon,
            latitude,
            longitude,
            address: chainWithIcon?.internal_id?.address || null
        };
    }));

    return c.json(result);
}
