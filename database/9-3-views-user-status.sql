-- 状態集約ビュー
CREATE OR REPLACE VIEW views_user_status AS
SELECT
    sm.pub_id,
    um.pub_id AS user_pub_id,

    check_relationship_access(um.rel_id, po.status) as privacy_allowed_status,
    check_relationship_access(um.rel_id, po.status_histories) as privacy_allowed_status_histories,
    check_relationship_access(um.rel_id, po.status_location) as privacy_allowed_status_location,

    CASE
        WHEN check_relationship_access(um.rel_id, po.status) THEN
            CASE
                WHEN check_relationship_access(um.rel_id, po.status_histories) THEN sm.started_at
                WHEN sm.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = sm.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN sm.started_at
                ELSE NULL
            END
        ELSE NULL
    END AS started_at,

    CASE
        WHEN check_relationship_access(um.rel_id, po.status) THEN
            CASE
                WHEN check_relationship_access(um.rel_id, po.status_histories) THEN sm.finished_at
                WHEN sm.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = sm.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN sm.finished_at
                ELSE NULL
            END
        ELSE NULL
    END AS finished_at,

    CASE
        WHEN check_relationship_access(um.rel_id, po.status) THEN
            CASE
                WHEN check_relationship_access(um.rel_id, po.status_histories) THEN sm.is_auto_detected
                WHEN sm.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = sm.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN sm.is_auto_detected
                ELSE NULL
            END
        ELSE NULL
    END AS is_auto_detected,

    -- gym情報
    CASE
        WHEN check_relationship_access(um.rel_id, po.status)
            AND check_relationship_access(um.rel_id, po.status_location) THEN
            CASE
                WHEN gm.pub_id IS NOT NULL THEN
                    json_build_object(
                        'pub_id', gm.pub_id,
                        'name', gm.name,
                        'gymchain', CASE
                            WHEN gcm.pub_id IS NOT NULL THEN
                                json_build_object(
                                    'pub_id', gcm.pub_id,
                                    'name', gcm.name,
                                    'icon', gcm.icon_rel_id,
                                    'internal_id', gm.gymchain_internal_id
                                )
                            ELSE NULL
                        END,
                        'photo', gm.photo_rel_id
                    )
                ELSE NULL
            END
        ELSE NULL
    END AS gym,

    -- partners配列（サブクエリで取得）
    CASE
        WHEN check_relationship_access(um.rel_id, po.status) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'handle', partner_um.handle,
                            'display_name', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.display_name) THEN partner_ulp.display_name
                                ELSE NULL
                            END,
                            'description', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.description) THEN partner_ulp.description
                                ELSE NULL
                            END,
                            'tags', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.tags) THEN (
                                    SELECT COALESCE(
                                        json_agg(
                                            json_build_object(
                                                'pub_id', ptm.pub_id,
                                                'name', ptm.name
                                            )
                                        ),
                                        '[]'::json
                                    )
                                    FROM users_lines_tags pult
                                    JOIN tags_master ptm ON pult.tag_rel_id = ptm.rel_id
                                    WHERE pult.user_rel_id = partner_um.rel_id
                                )
                                ELSE '[]'::json
                            END,
                            'icon', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.icon) THEN partner_ulp.icon_rel_id
                                ELSE NULL
                            END,
                            'skill_level', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.skill_level) THEN partner_ulp.skill_level
                                ELSE NULL
                            END,
                            'followings_count', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.followings_count) THEN (
                                    SELECT COUNT(*)
                                    FROM users_lines_followings pulf
                                    WHERE pulf.user_rel_id = partner_um.rel_id
                                )
                                ELSE NULL
                            END,
                            'followers_count', CASE
                                WHEN check_relationship_access(partner_um.rel_id, partner_po.followers_count) THEN (
                                    SELECT COUNT(*)
                                    FROM users_lines_followings pulf
                                    WHERE pulf.target_user_rel_id = partner_um.rel_id
                                )
                                ELSE NULL
                            END
                        )
                    ),
                    '[]'::json
                )
                FROM status_lines_partners slp
                JOIN users_master partner_um ON slp.partner_user_rel_id = partner_um.rel_id
                LEFT JOIN users_line_profile partner_ulp ON partner_um.rel_id = partner_ulp.user_rel_id
                LEFT JOIN users_line_privacy partner_po ON partner_um.rel_id = partner_po.user_rel_id
                WHERE slp.status_rel_id = sm.rel_id
            )
        ELSE '[]'::json
    END AS partners

FROM status_master sm
JOIN users_master um ON sm.user_rel_id = um.rel_id
LEFT JOIN users_line_privacy po ON um.rel_id = po.user_rel_id
LEFT JOIN gyms_master gm ON sm.gym_rel_id = gm.rel_id
LEFT JOIN gymchains_master gcm ON gm.gymchain_rel_id = gcm.rel_id;