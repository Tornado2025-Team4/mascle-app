CREATE OR REPLACE FUNCTION get_current_user_rel_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT rel_id
        FROM users_master
        WHERE pub_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION check_relationship_access(
    target_user_rel_id BIGINT,
    required_level relship
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_rel_id BIGINT;
BEGIN
    current_user_rel_id := get_current_user_rel_id();

    -- current_user_rel_idがnullの場合（認証されていない）
    IF current_user_rel_id IS NULL THEN
        -- anyoneの場合のみアクセス可能
        RETURN required_level = 'anyone';
    END IF;

    -- 自分自身の場合は常にアクセス可能
    IF current_user_rel_id = check_relationship_access.target_user_rel_id THEN
        RETURN TRUE;
    END IF;

    -- no-oneの場合は自分以外アクセス不可
    IF required_level = 'no-one' THEN
        RETURN FALSE;
    END IF;

    -- anyoneの場合は誰でもアクセス可能
    IF required_level = 'anyone' THEN
        RETURN TRUE;
    END IF;

    -- followersの場合: CurrentがTargetをフォローしているか
    IF required_level = 'followers' THEN
        RETURN EXISTS(
            SELECT 1 FROM users_lines_followings f
            WHERE f.user_rel_id = current_user_rel_id
            AND f.target_user_rel_id = check_relationship_access.target_user_rel_id
        );
    END IF;

    -- followingの場合: TargetがCurrentをフォローしているか
    IF required_level = 'following' THEN
        RETURN EXISTS(
            SELECT 1 FROM users_lines_followings f
            WHERE f.user_rel_id = check_relationship_access.target_user_rel_id
            AND f.target_user_rel_id = current_user_rel_id
        );
    END IF;

    -- follow-followersの場合: 相互フォロー
    IF required_level = 'follow-followers' THEN
        RETURN EXISTS(
            SELECT 1 FROM users_lines_followings ulf1
            WHERE ulf1.user_rel_id = current_user_rel_id
            AND ulf1.target_user_rel_id = check_relationship_access.target_user_rel_id
        ) AND EXISTS(
            SELECT 1 FROM users_lines_followings ulf2
            WHERE ulf2.user_rel_id = check_relationship_access.target_user_rel_id
            AND ulf2.target_user_rel_id = current_user_rel_id
        );
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
