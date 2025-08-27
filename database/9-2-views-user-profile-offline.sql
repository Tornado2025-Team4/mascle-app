CREATE VIEW view_users_line_profile_offline AS
SELECT
    u.anon_pub_id,

    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.handle_id)) as privacy_allowed_handle,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.display_name)) as privacy_allowed_display_name,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.description)) as privacy_allowed_description,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.icon)) as privacy_allowed_icon,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.birth_date)) as privacy_allowed_birth_date,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.age)) as privacy_allowed_age,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.generation)) as privacy_allowed_generation,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.gender)) as privacy_allowed_gender,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.registered_since)) as privacy_allowed_registered_since,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.training_since)) as privacy_allowed_training_since,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.skill_level)) as privacy_allowed_skill_level,

    CASE
        WHEN po.no_anonymous = true
            AND check_relationship_access(u.rel_id, po.handle_id) THEN u.handle
        ELSE NULL
    END as handle,

    CASE
        WHEN po.no_anonymous = true
            AND check_relationship_access(u.rel_id, po.display_name) THEN p.display_name
        ELSE NULL
    END as display_name,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.description) THEN p.description
        ELSE NULL
    END as description,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.icon) THEN p.icon_rel_id
        ELSE NULL
    END as icon_rel_id,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.birth_date) THEN p.birth_date
        ELSE NULL
    END as birth_date,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.age) THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::INTEGER
        ELSE NULL
    END as age,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.generation) THEN
            CASE WHEN p.birth_date IS NOT NULL THEN (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::INTEGER / 10) END
        ELSE NULL
    END as generation,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.gender) THEN p.gender
        ELSE NULL
    END as gender,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.registered_since) THEN
            (CURRENT_DATE - p.registered_at::date)
        ELSE NULL
    END as registered_since,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.training_since) THEN
            (CURRENT_DATE - p.training_since::date)
        ELSE NULL
    END as training_since,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.skill_level) THEN p.skill_level
        ELSE NULL
    END as skill_level
FROM users_master u
LEFT JOIN users_line_profile p ON u.rel_id = p.user_rel_id
LEFT JOIN users_line_privacy_offline po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_users_lines_tags_offline AS
SELECT
    u.anon_pub_id as user_anon_pub_id,
    ut.user_rel_id,

    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.tags)) as privacy_allowed,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.tags) THEN ut.tag_rel_id
        ELSE NULL
    END as tag_rel_id
FROM users_lines_tags ut
LEFT JOIN users_master u ON ut.user_rel_id = u.rel_id
LEFT JOIN users_line_privacy_offline po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_users_lines_intents_offline AS
SELECT
    u.anon_pub_id as user_anon_pub_id,

    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.intents)) as privacy_allowed,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.intents) THEN ui.intent_rel_id
        ELSE NULL
    END as intent_rel_id
FROM users_lines_intents ui
LEFT JOIN users_master u ON ui.user_rel_id = u.rel_id
LEFT JOIN users_line_privacy_offline po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_users_lines_intent_bodyparts_offline AS
SELECT
    u.anon_pub_id as user_anon_pub_id,

    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.intent_bodyparts)) as privacy_allowed,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.intent_bodyparts) THEN uib.bodypart_rel_id
        ELSE NULL
    END as bodypart_rel_id
FROM users_lines_intent_bodyparts uib
LEFT JOIN users_master u ON uib.user_rel_id = u.rel_id
LEFT JOIN users_line_privacy_offline po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_status_master_offline AS
SELECT
    s.pub_id,
    u.anon_pub_id as user_anon_pub_id,

    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.states)) as privacy_allowed_states,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.status_histories)) as privacy_allowed_histories,
    (po.no_anonymous = true AND check_relationship_access(u.rel_id, po.status_location)) as privacy_allowed_location,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.states) THEN
            CASE
                WHEN s.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = s.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN s.started_at
                ELSE NULL
            END
        ELSE NULL
    END as started_at,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.states) THEN
            CASE
                WHEN s.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = s.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN s.finished_at
                ELSE NULL
            END
        ELSE NULL
    END as finished_at,

    CASE
        WHEN po.no_anonymous = true AND check_relationship_access(u.rel_id, po.states) THEN
            CASE
                WHEN s.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = s.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN s.is_auto_detected
                ELSE NULL
            END
        ELSE NULL
    END as is_auto_detected,

    CASE
        WHEN po.no_anonymous = true
            AND check_relationship_access(u.rel_id, po.states)
            AND check_relationship_access(u.rel_id, po.status_location) THEN
            CASE
                WHEN s.rel_id = (
                    SELECT s2.rel_id FROM status_master s2
                    WHERE s2.user_rel_id = s.user_rel_id
                    ORDER BY s2.started_at DESC LIMIT 1
                ) THEN s.gym_rel_id
                ELSE NULL
            END
        ELSE NULL
    END as gym_rel_id
FROM status_master s
LEFT JOIN users_master u ON s.user_rel_id = u.rel_id
LEFT JOIN users_line_privacy_offline po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_users_summary_offline AS
SELECT
    u1.anon_pub_id as user_anon_pub_id,

    (po1.no_anonymous = true AND check_relationship_access(u1.rel_id, po1.followings)) as privacy_allowed_followings,
    (po1.no_anonymous = true AND check_relationship_access(u1.rel_id, po1.followers)) as privacy_allowed_followers,
    (po1.no_anonymous = true AND check_relationship_access(u1.rel_id, po1.posts)) as privacy_allowed_posts,

    CASE
        WHEN po1.no_anonymous = true AND check_relationship_access(u1.rel_id, po1.followings_count) THEN (
            SELECT COUNT(*) FROM users_lines_followings f WHERE f.user_rel_id = u1.rel_id
        )
        ELSE NULL
    END as followings_count,

    CASE
        WHEN po1.no_anonymous = true AND check_relationship_access(u1.rel_id, po1.followers_count) THEN (
            SELECT COUNT(*) FROM users_lines_followings f WHERE f.target_user_rel_id = u1.rel_id
        )
        ELSE NULL
    END as followers_count,

    CASE
        WHEN po1.no_anonymous = true AND check_relationship_access(u1.rel_id, po1.posts_count) THEN (
            SELECT COUNT(*) FROM user_posts up WHERE up.user_rel_id = u1.rel_id
        )
        ELSE NULL
    END as posts_count
FROM users_master u1
LEFT JOIN users_line_privacy_offline po1 ON u1.rel_id = po1.user_rel_id;


CREATE VIEW view_users_lines_followings_offline AS
SELECT
    f.rel_id,
    f.user_rel_id,
    u1.anon_pub_id as user_anon_pub_id,

    (
        po1.no_anonymous = true
        AND
        (
            check_relationship_access(f.user_rel_id, po1.followings)
            AND
            check_relationship_access(f.target_user_rel_id, po2.followers)
        )
        OR
        f.user_rel_id = get_current_user_rel_id()
        OR
        f.target_user_rel_id = get_current_user_rel_id()
    ) as privacy_allowed,

    CASE
        WHEN po1.no_anonymous = true
            AND (
                check_relationship_access(f.user_rel_id, po1.followings)
                AND
                check_relationship_access(f.target_user_rel_id, po2.followers)
            )
            OR f.user_rel_id = get_current_user_rel_id()
            OR f.target_user_rel_id = get_current_user_rel_id()
        THEN f.target_user_rel_id
        ELSE NULL
    END as target_user_rel_id,

    CASE
        WHEN po1.no_anonymous = true
            AND (
                check_relationship_access(f.user_rel_id, po1.followings)
                AND
                check_relationship_access(f.target_user_rel_id, po2.followers)
            )
            OR f.user_rel_id = get_current_user_rel_id()
            OR f.target_user_rel_id = get_current_user_rel_id()
        THEN f.followed_at
        ELSE NULL
    END as followed_at
FROM users_lines_followings f
LEFT JOIN users_master u1 ON f.user_rel_id = u1.rel_id
LEFT JOIN users_line_privacy_offline po1 ON f.user_rel_id = po1.user_rel_id
LEFT JOIN users_line_privacy_offline po2 ON f.target_user_rel_id = po2.user_rel_id;
