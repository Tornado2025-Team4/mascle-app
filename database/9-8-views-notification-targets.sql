-- 通知対象者を取得するためのビューと関数
-- 特定のユーザー（igniter）に対する通知対象者を動的に取得

-- フォロワー通知対象者ビュー
CREATE OR REPLACE VIEW views_notification_targets_followers AS
SELECT DISTINCT
    igniter_user.pub_id AS igniter_pub_id,
    target_user.pub_id AS target_pub_id,

    -- 匿名化判定フラグ
    CASE
        WHEN COALESCE(igniter_privacy_anon.completely_hidden, FALSE) = TRUE THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'no-one' THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'followers' AND NOT EXISTS (
            SELECT 1 FROM users_lines_followings ff1
            WHERE ff1.user_rel_id = target_user.rel_id
            AND ff1.target_user_rel_id = igniter_user.rel_id
        ) THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'following' AND NOT EXISTS (
            SELECT 1 FROM users_lines_followings ff2
            WHERE ff2.user_rel_id = igniter_user.rel_id
            AND ff2.target_user_rel_id = target_user.rel_id
        ) THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'follow-followers' AND NOT (
            EXISTS (
                SELECT 1 FROM users_lines_followings ff3
                WHERE ff3.user_rel_id = igniter_user.rel_id
                AND ff3.target_user_rel_id = target_user.rel_id
            ) AND EXISTS (
                SELECT 1 FROM users_lines_followings ff4
                WHERE ff4.user_rel_id = target_user.rel_id
                AND ff4.target_user_rel_id = igniter_user.rel_id
            )
        ) THEN TRUE
        ELSE FALSE
    END AS should_be_anon

FROM users_master igniter_user
-- igniter の設定情報を取得
LEFT JOIN users_line_config igniter_config ON igniter_user.rel_id = igniter_config.user_rel_id
LEFT JOIN users_line_privacy igniter_privacy ON igniter_user.rel_id = igniter_privacy.user_rel_id
LEFT JOIN users_line_privacy_anon igniter_privacy_anon ON igniter_user.rel_id = igniter_privacy_anon.user_rel_id

-- フォロワー関係
JOIN users_lines_followings follow_rel ON igniter_user.rel_id = follow_rel.target_user_rel_id
JOIN users_master target_user ON follow_rel.user_rel_id = target_user.rel_id

-- target の設定情報を取得
LEFT JOIN users_line_config target_config ON target_user.rel_id = target_config.user_rel_id
LEFT JOIN users_line_privacy target_privacy ON target_user.rel_id = target_privacy.user_rel_id

WHERE
    -- お互いにブロックされていない
    NOT EXISTS (
        SELECT 1 FROM users_lines_blocks ulb1
        WHERE (ulb1.user_rel_id = igniter_user.rel_id AND ulb1.target_user_rel_id = target_user.rel_id)
            OR (ulb1.user_rel_id = target_user.rel_id AND ulb1.target_user_rel_id = igniter_user.rel_id)
    )

    -- お互いに enable_matching_offline がtrue
    AND COALESCE(igniter_config.enable_matching_offline, TRUE) = TRUE
    AND COALESCE(target_config.enable_matching_offline, TRUE) = TRUE

    -- igniter の status がtargetに公開されている（プライバシーチェック）
    AND (
        COALESCE(igniter_privacy.status, 'no-one') = 'anyone' OR
        (COALESCE(igniter_privacy.status, 'no-one') = 'followers' AND EXISTS (
            SELECT 1 FROM users_lines_followings pf1
            WHERE pf1.user_rel_id = target_user.rel_id
            AND pf1.target_user_rel_id = igniter_user.rel_id
        )) OR
        (COALESCE(igniter_privacy.status, 'no-one') = 'following' AND EXISTS (
            SELECT 1 FROM users_lines_followings pf2
            WHERE pf2.user_rel_id = igniter_user.rel_id
            AND pf2.target_user_rel_id = target_user.rel_id
        )) OR
        (COALESCE(igniter_privacy.status, 'no-one') = 'follow-followers' AND
            EXISTS (
                SELECT 1 FROM users_lines_followings pf3
                WHERE pf3.user_rel_id = igniter_user.rel_id
                AND pf3.target_user_rel_id = target_user.rel_id
            ) AND EXISTS (
                SELECT 1 FROM users_lines_followings pf4
                WHERE pf4.user_rel_id = target_user.rel_id
                AND pf4.target_user_rel_id = igniter_user.rel_id
            )
        )
    );

-- ジムユーザー通知対象者ビュー
CREATE OR REPLACE VIEW views_notification_targets_gym_users AS
SELECT DISTINCT
    igniter_user.pub_id AS igniter_pub_id,
    target_user.pub_id AS target_pub_id,
    target_status.gym_rel_id AS gym_rel_id,

    -- 匿名化判定フラグ
    CASE
        WHEN COALESCE(igniter_privacy_anon.completely_hidden, FALSE) = TRUE THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'no-one' THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'followers' AND NOT EXISTS (
            SELECT 1 FROM users_lines_followings gf1
            WHERE gf1.user_rel_id = target_user.rel_id
            AND gf1.target_user_rel_id = igniter_user.rel_id
        ) THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'following' AND NOT EXISTS (
            SELECT 1 FROM users_lines_followings gf2
            WHERE gf2.user_rel_id = igniter_user.rel_id
            AND gf2.target_user_rel_id = target_user.rel_id
        ) THEN TRUE
        WHEN igniter_privacy_anon.view_real_profile = 'follow-followers' AND NOT (
            EXISTS (
                SELECT 1 FROM users_lines_followings gf3
                WHERE gf3.user_rel_id = igniter_user.rel_id
                AND gf3.target_user_rel_id = target_user.rel_id
            ) AND EXISTS (
                SELECT 1 FROM users_lines_followings gf4
                WHERE gf4.user_rel_id = target_user.rel_id
                AND gf4.target_user_rel_id = igniter_user.rel_id
            )
        ) THEN TRUE
        ELSE FALSE
    END AS should_be_anon

FROM users_master igniter_user

-- igniter の設定情報を取得
LEFT JOIN users_line_config igniter_config ON igniter_user.rel_id = igniter_config.user_rel_id
LEFT JOIN users_line_privacy igniter_privacy ON igniter_user.rel_id = igniter_privacy.user_rel_id
LEFT JOIN users_line_privacy_anon igniter_privacy_anon ON igniter_user.rel_id = igniter_privacy_anon.user_rel_id

-- 同じジムで運動中のユーザー
JOIN status_master target_status ON target_status.finished_at IS NULL  -- 運動中
    AND target_status.user_rel_id != igniter_user.rel_id  -- 自分以外
JOIN users_master target_user ON target_status.user_rel_id = target_user.rel_id

-- target の設定情報を取得
LEFT JOIN users_line_config target_config ON target_user.rel_id = target_config.user_rel_id
LEFT JOIN users_line_privacy target_privacy ON target_user.rel_id = target_privacy.user_rel_id

WHERE
    -- お互いにブロックされていない
    NOT EXISTS (
        SELECT 1 FROM users_lines_blocks ulb2
        WHERE (ulb2.user_rel_id = igniter_user.rel_id AND ulb2.target_user_rel_id = target_user.rel_id)
            OR (ulb2.user_rel_id = target_user.rel_id AND ulb2.target_user_rel_id = igniter_user.rel_id)
    )

    -- お互いに enable_matching_offline がtrue
    AND COALESCE(igniter_config.enable_matching_offline, TRUE) = TRUE
    AND COALESCE(target_config.enable_matching_offline, TRUE) = TRUE

    -- igniter の status_location がtargetに公開されている（プライバシーチェック）
    AND (
        COALESCE(igniter_privacy.status_location, 'no-one') = 'anyone' OR
        (COALESCE(igniter_privacy.status_location, 'no-one') = 'followers' AND EXISTS (
            SELECT 1 FROM users_lines_followings lf1
            WHERE lf1.user_rel_id = target_user.rel_id 
            AND lf1.target_user_rel_id = igniter_user.rel_id
        )) OR
        (COALESCE(igniter_privacy.status_location, 'no-one') = 'following' AND EXISTS (
            SELECT 1 FROM users_lines_followings lf2
            WHERE lf2.user_rel_id = igniter_user.rel_id 
            AND lf2.target_user_rel_id = target_user.rel_id
        )) OR
        (COALESCE(igniter_privacy.status_location, 'no-one') = 'follow-followers' AND 
            EXISTS (
                SELECT 1 FROM users_lines_followings lf3
                WHERE lf3.user_rel_id = igniter_user.rel_id 
                AND lf3.target_user_rel_id = target_user.rel_id
            ) AND EXISTS (
                SELECT 1 FROM users_lines_followings lf4
                WHERE lf4.user_rel_id = target_user.rel_id 
                AND lf4.target_user_rel_id = igniter_user.rel_id
            )
        )
    );
