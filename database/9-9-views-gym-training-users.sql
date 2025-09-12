-- ジムでトレーニング中のユーザーを取得するビュー（シンプル版）
CREATE OR REPLACE VIEW views_gym_training_users AS
SELECT
    gm.pub_id AS gym_pub_id,
    gm.name AS gym_name,
    um.rel_id AS user_rel_id,
    um.pub_id AS user_pub_id,
    um.handle AS user_handle,
    um.anon_pub_id AS user_anon_pub_id,
    sm.pub_id AS status_pub_id,
    sm.started_at,
    sm.finished_at,

    -- プライバシー設定に基づく可視性チェック
    CASE
        WHEN upa.completely_hidden = TRUE THEN 'hidden'
        WHEN check_relationship_access(um.rel_id, upa.view_real_profile) THEN 'real'
        ELSE 'anonymous'
    END AS visibility_level

FROM status_master sm
JOIN users_master um ON sm.user_rel_id = um.rel_id
JOIN gyms_master gm ON sm.gym_rel_id = gm.rel_id
LEFT JOIN users_line_privacy_anon upa ON um.rel_id = upa.user_rel_id
WHERE
    sm.finished_at IS NULL  -- 現在トレーニング中（終了時刻がnull）
    AND sm.gym_rel_id IS NOT NULL  -- ジムが指定されている
    AND gm.pub_id IS NOT NULL;  -- ジムの公開IDが存在する

-- インデックスの追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx__status_master__active_training
ON status_master (gym_rel_id, finished_at)
WHERE finished_at IS NULL;

CREATE INDEX IF NOT EXISTS idx__status_master__gym_training_active
ON status_master (gym_rel_id, started_at, finished_at)
WHERE finished_at IS NULL;
