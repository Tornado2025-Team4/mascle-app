-- 匿名プロフィールビュー
CREATE OR REPLACE VIEW views_user_profile_anon AS
SELECT
    um.anon_pub_id,

    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.display_name)) as privacy_allowed_display_name,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.description)) as privacy_allowed_description,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.tags)) as privacy_allowed_tags,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.icon)) as privacy_allowed_icon,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.birth_date)) as privacy_allowed_birth_date,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.age)) as privacy_allowed_age,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.generation)) as privacy_allowed_generation,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.gender)) as privacy_allowed_gender,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.registered_since)) as privacy_allowed_registered_since,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.training_since)) as privacy_allowed_training_since,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.skill_level)) as privacy_allowed_skill_level,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.intents)) as privacy_allowed_intents,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.intent_bodyparts)) as privacy_allowed_intent_bodyparts,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.followings_count)) as privacy_allowed_followings_count,
    (po.completely_hidden = false AND check_relationship_access(um.rel_id, po.followers_count)) as privacy_allowed_followers_count,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.display_name) THEN ulp.display_name
        ELSE NULL
    END as display_name,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.description) THEN ulp.description
        ELSE NULL
    END as description,

    -- tags配列
    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.tags) THEN
            COALESCE(
                json_agg(
                    json_build_object(
                        'pub_id', tm.pub_id,
                        'name', tm.name
                    )
                ) FILTER (WHERE tm.pub_id IS NOT NULL),
                '[]'::json
            )
        ELSE '[]'::json
    END AS tags,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.icon) THEN ulp.icon_rel_id
        ELSE NULL
    END AS icon,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.birth_date) THEN ulp.birth_date
        ELSE NULL
    END AS birth_date,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.age) THEN
            CASE
                WHEN ulp.birth_date IS NOT NULL
                THEN EXTRACT(YEAR FROM AGE(ulp.birth_date))::INTEGER
                ELSE NULL
            END
        ELSE NULL
    END AS age,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.generation) THEN
            CASE
                WHEN ulp.birth_date IS NOT NULL
                THEN FLOOR(EXTRACT(YEAR FROM AGE(ulp.birth_date)) / 10) * 10
                ELSE NULL
            END
        ELSE NULL
    END AS generation,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.gender) THEN ulp.gender
        ELSE NULL
    END AS gender,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.registered_since) THEN ulp.registered_at
        ELSE NULL
    END AS registered_since,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.training_since) THEN ulp.training_since
        ELSE NULL
    END AS training_since,

    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.skill_level) THEN ulp.skill_level
        ELSE NULL
    END AS skill_level,

    -- intents配列（サブクエリで取得）
    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.intents) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'pub_id', im.pub_id,
                            'intent', im.intent
                        )
                    ),
                    '[]'::json
                )
                FROM users_lines_intents uli
                JOIN intents_master im ON uli.intent_rel_id = im.rel_id
                WHERE uli.user_rel_id = um.rel_id
            )
        ELSE '[]'::json
    END AS intents,

    -- intent_bodyparts配列（サブクエリで取得）
    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.intent_bodyparts) THEN
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'pub_id', bm.pub_id,
                            'bodypart', bm.bodypart
                        )
                    ),
                    '[]'::json
                )
                FROM users_lines_intent_bodyparts ulibp
                JOIN bodyparts_master bm ON ulibp.bodypart_rel_id = bm.rel_id
                WHERE ulibp.user_rel_id = um.rel_id
            )
        ELSE '[]'::json
    END AS intent_bodyparts,

    -- フォロー数（サブクエリで取得）
    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.followings_count) THEN
            (
                SELECT COUNT(*)
                FROM users_lines_followings ulf
                WHERE ulf.user_rel_id = um.rel_id
            )
        ELSE NULL
    END AS followings_count,

    -- フォロワー数（サブクエリで取得）
    CASE
        WHEN po.completely_hidden = false AND check_relationship_access(um.rel_id, po.followers_count) THEN
            (
                SELECT COUNT(*)
                FROM users_lines_followings ulf
                WHERE ulf.target_user_rel_id = um.rel_id
            )
        ELSE NULL
    END AS followers_count

FROM users_master um
LEFT JOIN users_line_profile ulp ON um.rel_id = ulp.user_rel_id
LEFT JOIN users_line_privacy_anon po ON um.rel_id = po.user_rel_id
LEFT JOIN users_lines_tags ult ON um.rel_id = ult.user_rel_id
LEFT JOIN tags_master tm ON ult.tag_rel_id = tm.rel_id
GROUP BY
    um.rel_id,
    um.anon_pub_id,
    ulp.display_name,
    ulp.description,
    ulp.icon_rel_id,
    ulp.birth_date,
    ulp.gender,
    ulp.registered_at,
    ulp.training_since,
    ulp.skill_level,
    po.completely_hidden,
    po.display_name,
    po.description,
    po.tags,
    po.icon,
    po.birth_date,
    po.age,
    po.generation,
    po.gender,
    po.registered_since,
    po.training_since,
    po.skill_level,
    po.intents,
    po.intent_bodyparts,
    po.followings_count,
    po.followers_count;