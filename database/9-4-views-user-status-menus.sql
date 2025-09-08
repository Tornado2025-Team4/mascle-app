-- メニュー集約ビュー
CREATE OR REPLACE VIEW views_user_status_menus AS
SELECT
    sm.pub_id AS state_pub_id,

    check_relationship_access(um.rel_id, po.status_menus) as privacy_allowed_status_menus,
    check_relationship_access(um.rel_id, po.status_histories) as privacy_allowed_status_histories,

    -- menus配列
    CASE
        WHEN check_relationship_access(um.rel_id, po.status_menus) THEN
            COALESCE(
                json_agg(
                    json_build_object(
                        'menu', json_build_object(
                            'pub_id', mm.pub_id,
                            'name', mm.name,
                            'bodypart', CASE
                                WHEN bm.pub_id IS NOT NULL THEN
                                    json_build_object(
                                        'pub_id', bm.pub_id,
                                        'name', bm.bodypart
                                    )
                                ELSE NULL
                            END
                        ),
                        'sets', (
                            SELECT COALESCE(
                                json_agg(
                                    json_build_object(
                                        'weight', slms.weight,
                                        'reps', slms.reps
                                    )
                                    ORDER BY slms.set_num
                                ),
                                '[]'::json
                            )
                            FROM status_lines_menus_sets slms
                            WHERE slms.status_menu_rel_id = slm.rel_id
                        )
                    )
                ) FILTER (WHERE mm.pub_id IS NOT NULL),
                '[]'::json
            )
        ELSE '[]'::json
    END AS menus

FROM status_master sm
JOIN users_master um ON sm.user_rel_id = um.rel_id
LEFT JOIN users_line_privacy po ON um.rel_id = po.user_rel_id
LEFT JOIN status_lines_menus slm ON sm.rel_id = slm.status_rel_id
LEFT JOIN menus_master mm ON slm.menu_rel_id = mm.rel_id
LEFT JOIN bodyparts_master bm ON mm.bodypart_rel_id = bm.rel_id
GROUP BY sm.rel_id, sm.pub_id, um.rel_id, po.status_menus, po.status_histories;


-- 有酸素メニュー集約ビュー（有酸素運動の詳細表示用）
CREATE OR REPLACE VIEW views_user_status_menus_cardio AS
SELECT
    sm.pub_id AS state_pub_id,

    check_relationship_access(um.rel_id, po.status_menus) as privacy_allowed_status_menus,
    check_relationship_access(um.rel_id, po.status_histories) as privacy_allowed_status_histories,

    -- cardio menus配列
    CASE
        WHEN check_relationship_access(um.rel_id, po.status_menus) THEN
            COALESCE(
                json_agg(
                    json_build_object(
                        'menu', json_build_object(
                            'pub_id', mcm.pub_id,
                            'name', mcm.name
                        ),
                        'duration', slmcd.duration,
                        'distance', slmcd.distance
                    )
                ) FILTER (WHERE mcm.pub_id IS NOT NULL),
                '[]'::json
            )
        ELSE '[]'::json
    END AS menus

FROM status_master sm
JOIN users_master um ON sm.user_rel_id = um.rel_id
LEFT JOIN users_line_privacy po ON um.rel_id = po.user_rel_id
LEFT JOIN status_lines_menus_cardio slmc ON sm.rel_id = slmc.status_rel_id
LEFT JOIN menus_cardio_master mcm ON slmc.menu_cardio_rel_id = mcm.rel_id
LEFT JOIN status_lines_menus_cardio_details slmcd ON slmc.rel_id = slmcd.status_menu_cardio_rel_id
GROUP BY sm.rel_id, sm.pub_id, um.rel_id, po.status_menus, po.status_histories;