-- ユーザーの現在のトレーニング状況から現在のジム情報を取得するビュー
-- finished_at IS NULL AND gym_rel_id IS NOT NULL の条件でユーザーの現在のジムを特定
CREATE OR REPLACE VIEW views_user_current_gym AS
SELECT
    um.pub_id AS user_pub_id,
    gm.pub_id AS gym_pub_id,
    gm.name AS gym_name,
    sm.pub_id AS status_pub_id,
    sm.started_at
FROM users_master um
JOIN status_master sm ON um.rel_id = sm.user_rel_id
JOIN gyms_master gm ON sm.gym_rel_id = gm.rel_id
WHERE
    sm.finished_at IS NULL              -- 未終了のトレーニング
    AND sm.gym_rel_id IS NOT NULL       -- ジムが設定されている
    AND gm.pub_id IS NOT NULL;          -- ジムの公開IDが存在する

-- パフォーマンス向上のためのインデックス（既に存在する場合は何もしない）
CREATE INDEX IF NOT EXISTS idx__status_master__active_training_current_gym
ON status_master (user_rel_id, gym_rel_id, finished_at)
WHERE finished_at IS NULL AND gym_rel_id IS NOT NULL;