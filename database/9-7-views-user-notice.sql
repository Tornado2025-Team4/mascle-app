-- 通知ビュー
CREATE OR REPLACE VIEW views_user_notice AS
SELECT
    target_um.pub_id AS user_pub_id,
    nlau.is_read,
    nm.pub_id,
    nm.notified_at,
    nm.kind,

    -- igniter_user（should_be_anonフラグに基づいて表示を切り替え）
    CASE
        WHEN nm.igniter_user_rel_id IS NOT NULL THEN
            json_build_object(
                'pub_id', CASE
                    WHEN nlau.should_be_anon THEN NULL
                    ELSE igniter_um.pub_id
                END,
                'anon_pub_id', CASE
                    WHEN nlau.should_be_anon THEN igniter_um.anon_pub_id
                    ELSE NULL
                END,
                'handle', CASE
                    WHEN nlau.should_be_anon THEN NULL
                    ELSE igniter_um.handle
                END,
                'display_name', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.display_name)
                            THEN igniter_ulp.display_name
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.display_name)
                            THEN igniter_ulp.display_name
                            ELSE NULL
                        END
                END,
                'description', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.description)
                            THEN igniter_ulp.description
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.description)
                            THEN igniter_ulp.description
                            ELSE NULL
                        END
                END,
                'tags', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.tags) THEN
                                (
                                    SELECT COALESCE(
                                        json_agg(
                                            json_build_object(
                                                'pub_id', itm.pub_id,
                                                'name', itm.name
                                            )
                                        ),
                                        '[]'::json
                                    )
                                    FROM users_lines_tags iult
                                    JOIN tags_master itm ON iult.tag_rel_id = itm.rel_id
                                    WHERE iult.user_rel_id = igniter_um.rel_id
                                )
                            ELSE '[]'::json
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.tags) THEN
                                (
                                    SELECT COALESCE(
                                        json_agg(
                                            json_build_object(
                                                'pub_id', itm.pub_id,
                                                'name', itm.name
                                            )
                                        ),
                                        '[]'::json
                                    )
                                    FROM users_lines_tags iult
                                    JOIN tags_master itm ON iult.tag_rel_id = itm.rel_id
                                    WHERE iult.user_rel_id = igniter_um.rel_id
                                )
                            ELSE '[]'::json
                        END
                END,
                'icon_rel_id', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.icon)
                            THEN igniter_ulp.icon_rel_id
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.icon)
                            THEN igniter_ulp.icon_rel_id
                            ELSE NULL
                        END
                END,
                'icon_name', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.icon)
                            THEN iso.name
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.icon)
                            THEN iso.name
                            ELSE NULL
                        END
                END,
                'skill_level', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.skill_level)
                            THEN igniter_ulp.skill_level
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.skill_level)
                            THEN igniter_ulp.skill_level
                            ELSE NULL
                        END
                END,
                'followings_count', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.followings_count) THEN
                                (
                                    SELECT COUNT(*)
                                    FROM users_lines_followings iulf
                                    WHERE iulf.user_rel_id = igniter_um.rel_id
                                )
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.followings_count) THEN
                                (
                                    SELECT COUNT(*)
                                    FROM users_lines_followings iulf
                                    WHERE iulf.user_rel_id = igniter_um.rel_id
                                )
                            ELSE NULL
                        END
                END,
                'followers_count', CASE
                    WHEN nlau.should_be_anon THEN
                        CASE
                            WHEN igniter_po_anon.completely_hidden = false
                                AND check_relationship_access(igniter_um.rel_id, igniter_po_anon.followers_count) THEN
                                (
                                    SELECT COUNT(*)
                                    FROM users_lines_followings iulf
                                    WHERE iulf.target_user_rel_id = igniter_um.rel_id
                                )
                            ELSE NULL
                        END
                    ELSE
                        CASE
                            WHEN check_relationship_access(igniter_um.rel_id, igniter_po.followers_count) THEN
                                (
                                    SELECT COUNT(*)
                                    FROM users_lines_followings iulf
                                    WHERE iulf.target_user_rel_id = igniter_um.rel_id
                                )
                            ELSE NULL
                        END
                END
            )
        ELSE NULL
    END AS igniter_user

FROM notices_lines_assigned_users nlau
JOIN notices_master nm ON nlau.notice_rel_id = nm.rel_id
JOIN users_master target_um ON nlau.target_user_rel_id = target_um.rel_id
LEFT JOIN users_master igniter_um ON nm.igniter_user_rel_id = igniter_um.rel_id
LEFT JOIN users_line_profile igniter_ulp ON igniter_um.rel_id = igniter_ulp.user_rel_id
LEFT JOIN users_line_privacy igniter_po ON igniter_um.rel_id = igniter_po.user_rel_id
LEFT JOIN users_line_privacy_anon igniter_po_anon ON igniter_um.rel_id = igniter_po_anon.user_rel_id
LEFT JOIN storage.objects iso ON igniter_ulp.icon_rel_id = iso.id;