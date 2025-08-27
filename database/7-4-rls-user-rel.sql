CREATE POLICY "users_lines_followings_select_policy" ON users_lines_followings
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        target_user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "users_lines_followings_insert_policy" ON users_lines_followings
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_followings_update_policy" ON users_lines_followings
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_followings_delete_policy" ON users_lines_followings
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_lines_blocks_select_policy" ON users_lines_blocks
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        target_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_blocks_insert_policy" ON users_lines_blocks
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_blocks_update_policy" ON users_lines_blocks
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_blocks_delete_policy" ON users_lines_blocks
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );
