-- 地理的検索用のRPC関数
CREATE OR REPLACE FUNCTION get_nearby_gyms(
    center_lat FLOAT,
    center_lng FLOAT,
    radius_meters FLOAT,
    max_results INT DEFAULT 50
)
RETURNS TABLE(
    pub_id CHAR(21),
    name VARCHAR(200),
    photo_rel_id UUID,
    location GEOGRAPHY(POINT, 4326),
    gymchain_rel_id BIGINT,
    gymchain_internal_id JSONB
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT
        g.pub_id,
        g.name,
        g.photo_rel_id,
        g.location,
        g.gymchain_rel_id,
        g.gymchain_internal_id
    FROM gyms_master g
    WHERE g.location IS NOT NULL
        AND ST_DWithin(
            g.location,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            radius_meters
        )
    ORDER BY ST_Distance(
        g.location,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    )
    LIMIT max_results;
$$;