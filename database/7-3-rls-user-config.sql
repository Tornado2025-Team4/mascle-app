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


CREATE POLICY "users_line_privacy_select_policy" ON users_line_privacy
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_insert_policy" ON users_line_privacy
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_update_policy" ON users_line_privacy
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_delete_policy" ON users_line_privacy
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_line_privacy_anon_select_policy" ON users_line_privacy_anon
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_anon_insert_policy" ON users_line_privacy_anon
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_anon_update_policy" ON users_line_privacy_anon
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_privacy_anon_delete_policy" ON users_line_privacy_anon
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );
