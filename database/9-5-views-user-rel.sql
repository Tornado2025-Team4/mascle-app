-- ユーザフォロー関連ビュー（フォロー関係の詳細表示用）
CREATE OR REPLACE VIEW views_user_rel AS
SELECT
    (
        check_relationship_access(ulf.user_rel_id, po1.followings)
        AND
        check_relationship_access(ulf.target_user_rel_id, po2.followers)
    ) OR ulf.user_rel_id = get_current_user_rel_id()
        OR ulf.target_user_rel_id = get_current_user_rel_id() as privacy_allowed,

    CASE
        WHEN (
                check_relationship_access(ulf.user_rel_id, po1.followings)
                AND
                check_relationship_access(ulf.target_user_rel_id, po2.followers)
            )
            OR ulf.user_rel_id = get_current_user_rel_id()
            OR ulf.target_user_rel_id = get_current_user_rel_id()
        THEN follower_um.pub_id
        ELSE NULL
    END AS follower_user_pub_id,

    CASE
        WHEN (
                check_relationship_access(ulf.user_rel_id, po1.followings)
                AND
                check_relationship_access(ulf.target_user_rel_id, po2.followers)
            )
            OR ulf.user_rel_id = get_current_user_rel_id()
            OR ulf.target_user_rel_id = get_current_user_rel_id()
        THEN followed_um.pub_id
        ELSE NULL
    END AS followed_user_pub_id,

    CASE
        WHEN (
                check_relationship_access(ulf.user_rel_id, po1.followings)
                AND
                check_relationship_access(ulf.target_user_rel_id, po2.followers)
            )
            OR ulf.user_rel_id = get_current_user_rel_id()
            OR ulf.target_user_rel_id = get_current_user_rel_id()
        THEN ulf.followed_at
        ELSE NULL
    END AS followed_at

FROM users_lines_followings ulf
JOIN users_master follower_um ON ulf.user_rel_id = follower_um.rel_id
JOIN users_master followed_um ON ulf.target_user_rel_id = followed_um.rel_id
LEFT JOIN users_line_privacy po1 ON ulf.user_rel_id = po1.user_rel_id
LEFT JOIN users_line_privacy po2 ON ulf.target_user_rel_id = po2.user_rel_id;