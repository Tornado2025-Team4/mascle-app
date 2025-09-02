-- 投稿集約ビュー
CREATE OR REPLACE VIEW views_user_post AS
SELECT
    check_relationship_access(um.rel_id, po.posts) as privacy_allowed_posts,
    check_relationship_access(um.rel_id, po.posts_location) as privacy_allowed_posts_location,

    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN pm.pub_id
        ELSE NULL
    END as pub_id,

    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN um.pub_id
        ELSE NULL
    END AS user_pub_id,

    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN sm.pub_id
        ELSE NULL
    END AS status_pub_id,

    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN pm.posted_at
        ELSE NULL
    END AS posted_at,

    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN pm.body
        ELSE NULL
    END AS body,

    -- mentions配列（サブクエリで取得）
    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'target_user', json_build_object(
                                'handle', target_um.handle,
                                'display_name', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.display_name) THEN target_ulp.display_name
                                    ELSE NULL
                                END,
                                'description', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.description) THEN target_ulp.description
                                    ELSE NULL
                                END,
                                'tags', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.tags) THEN (
                                        SELECT COALESCE(
                                            json_agg(
                                                json_build_object(
                                                    'pub_id', ttm.pub_id,
                                                    'name', ttm.name
                                                )
                                            ),
                                            '[]'::json
                                        )
                                        FROM users_lines_tags tult
                                        JOIN tags_master ttm ON tult.tag_rel_id = ttm.rel_id
                                        WHERE tult.user_rel_id = target_um.rel_id
                                    )
                                    ELSE '[]'::json
                                END,
                                'icon', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.icon) THEN target_ulp.icon_rel_id
                                    ELSE NULL
                                END,
                                'skill_level', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.skill_level) THEN target_ulp.skill_level
                                    ELSE NULL
                                END,
                                'followings_count', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.followings_count) THEN (
                                        SELECT COUNT(*)
                                        FROM users_lines_followings tulf
                                        WHERE tulf.user_rel_id = target_um.rel_id
                                    )
                                    ELSE NULL
                                END,
                                'followers_count', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.followers_count) THEN (
                                        SELECT COUNT(*)
                                        FROM users_lines_followings tulf
                                        WHERE tulf.target_user_rel_id = target_um.rel_id
                                    )
                                    ELSE NULL
                                END
                            ),
                            'offset', plbm.offset_num
                        )
                    ),
                    '[]'::json
                )
                FROM posts_lines_body_mentions plbm
                JOIN users_master target_um ON plbm.target_user_rel_id = target_um.rel_id
                LEFT JOIN users_line_profile target_ulp ON target_um.rel_id = target_ulp.user_rel_id
                LEFT JOIN users_line_privacy target_po ON target_um.rel_id = target_po.user_rel_id
                WHERE plbm.post_rel_id = pm.rel_id
            )
        ELSE '[]'::json
    END AS mentions,

    -- tags配列（サブクエリで取得）
    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'pub_id', tm.pub_id,
                            'name', tm.name
                        )
                    ),
                    '[]'::json
                )
                FROM posts_lines_tags plt
                JOIN tags_master tm ON plt.tag_rel_id = tm.rel_id
                WHERE plt.post_rel_id = pm.rel_id
            )
        ELSE '[]'::json
    END AS tags,

    -- photos配列（サブクエリで取得）
    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'url', plp.photo_rel_id,
                            'thumb_url', plp.photo_thumb_rel_id
                        )
                    ),
                    '[]'::json
                )
                FROM posts_lines_photos plp
                WHERE plp.post_rel_id = pm.rel_id
            )
        ELSE '[]'::json
    END AS photos,

    -- いいね数（サブクエリで取得）
    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN
            (
                SELECT COUNT(*)
                FROM posts_lines_likes pll
                WHERE pll.post_rel_id = pm.rel_id
            )
        ELSE NULL
    END AS likes_count,

    -- コメント数（サブクエリで取得）
    CASE
        WHEN check_relationship_access(um.rel_id, po.posts) THEN
            (
                SELECT COUNT(*)
                FROM comments_master cm
                WHERE cm.post_rel_id = pm.rel_id
            )
        ELSE NULL
    END AS comments_count

FROM posts_master pm
JOIN users_master um ON pm.posted_user_rel_id = um.rel_id
LEFT JOIN users_line_privacy po ON um.rel_id = po.user_rel_id
LEFT JOIN status_master sm ON pm.status_rel_id = sm.rel_id;


-- 投稿コメント集約ビュー
CREATE OR REPLACE VIEW views_user_post_comments AS
SELECT
    check_relationship_access(post_um.rel_id, post_po.posts) as privacy_allowed_posts,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN cm.pub_id
        ELSE NULL
    END as pub_id,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN pm.pub_id
        ELSE NULL
    END AS post_pub_id,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN um.pub_id
        ELSE NULL
    END AS user_pub_id,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN cm.commented_at
        ELSE NULL
    END AS commented_at,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN cm.body
        ELSE NULL
    END AS body,

    -- mentions配列（サブクエリで取得）
    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'target_user', json_build_object(
                                'handle', target_um.handle,
                                'display_name', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.display_name) THEN target_ulp.display_name
                                    ELSE NULL
                                END,
                                'description', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.description) THEN target_ulp.description
                                    ELSE NULL
                                END,
                                'tags', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.tags) THEN (
                                        SELECT COALESCE(
                                            json_agg(
                                                json_build_object(
                                                    'pub_id', ttm.pub_id,
                                                    'name', ttm.name
                                                )
                                            ),
                                            '[]'::json
                                        )
                                        FROM users_lines_tags tult
                                        JOIN tags_master ttm ON tult.tag_rel_id = ttm.rel_id
                                        WHERE tult.user_rel_id = target_um.rel_id
                                    )
                                    ELSE '[]'::json
                                END,
                                'icon', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.icon) THEN target_ulp.icon_rel_id
                                    ELSE NULL
                                END,
                                'skill_level', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.skill_level) THEN target_ulp.skill_level
                                    ELSE NULL
                                END,
                                'followings_count', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.followings_count) THEN (
                                        SELECT COUNT(*)
                                        FROM users_lines_followings tulf
                                        WHERE tulf.user_rel_id = target_um.rel_id
                                    )
                                    ELSE NULL
                                END,
                                'followers_count', CASE
                                    WHEN check_relationship_access(target_um.rel_id, target_po.followers_count) THEN (
                                        SELECT COUNT(*)
                                        FROM users_lines_followings tulf
                                        WHERE tulf.target_user_rel_id = target_um.rel_id
                                    )
                                    ELSE NULL
                                END
                            ),
                            'offset', clm.offset_num
                        )
                    ),
                    '[]'::json
                )
                FROM comments_lines_mentions clm
                JOIN users_master target_um ON clm.user_rel_id = target_um.rel_id
                LEFT JOIN users_line_profile target_ulp ON target_um.rel_id = target_ulp.user_rel_id
                LEFT JOIN users_line_privacy target_po ON target_um.rel_id = target_po.user_rel_id
                WHERE clm.comment_rel_id = cm.rel_id
            )
        ELSE '[]'::json
    END AS mentions

FROM comments_master cm
JOIN posts_master pm ON cm.post_rel_id = pm.rel_id
JOIN users_master um ON cm.user_rel_id = um.rel_id
JOIN users_master post_um ON pm.posted_user_rel_id = post_um.rel_id
LEFT JOIN users_line_privacy post_po ON post_um.rel_id = post_po.user_rel_id;


-- 投稿いいね集約ビュー
CREATE OR REPLACE VIEW views_user_post_likes AS
SELECT
    check_relationship_access(post_um.rel_id, post_po.posts) as privacy_allowed_posts,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN pm.pub_id
        ELSE NULL
    END AS post_pub_id,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN um.pub_id
        ELSE NULL
    END AS user_pub_id,

    CASE
        WHEN check_relationship_access(post_um.rel_id, post_po.posts) THEN pll.liked_at
        ELSE NULL
    END AS liked_at

FROM posts_lines_likes pll
JOIN posts_master pm ON pll.post_rel_id = pm.rel_id
JOIN users_master um ON pll.user_rel_id = um.rel_id
JOIN users_master post_um ON pm.posted_user_rel_id = post_um.rel_id
LEFT JOIN users_line_privacy post_po ON post_um.rel_id = post_po.user_rel_id;