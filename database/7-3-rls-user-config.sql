CREATE POLICY "users_line_config_select_policy" ON users_line_config
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_config_insert_policy" ON users_line_config
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_config_update_policy" ON users_line_config
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_config_delete_policy" ON users_line_config
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_line_privacy_online_select_policy" ON users_line_privacy_online
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_online_insert_policy" ON users_line_privacy_online
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_online_update_policy" ON users_line_privacy_online
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_online_delete_policy" ON users_line_privacy_online
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_line_privacy_offline_select_policy" ON users_line_privacy_offline
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_offline_insert_policy" ON users_line_privacy_offline
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_offline_update_policy" ON users_line_privacy_offline
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_offline_delete_policy" ON users_line_privacy_offline
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );
