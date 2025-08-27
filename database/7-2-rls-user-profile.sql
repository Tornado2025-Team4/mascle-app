CREATE POLICY "users_lines_tags_select_policy" ON users_lines_tags
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "users_lines_tags_insert_policy" ON users_lines_tags
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_tags_update_policy" ON users_lines_tags
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_tags_delete_policy" ON users_lines_tags
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_line_profile_select_policy" ON users_line_profile
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "users_line_profile_insert_policy" ON users_line_profile
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_profile_update_policy" ON users_line_profile
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_line_profile_delete_policy" ON users_line_profile
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_lines_intents_select_policy" ON users_lines_intents
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "users_lines_intents_insert_policy" ON users_lines_intents
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_intents_update_policy" ON users_lines_intents
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_intents_delete_policy" ON users_lines_intents
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_lines_intent_bodyparts_select_policy" ON users_lines_intent_bodyparts
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "users_lines_intent_bodyparts_insert_policy" ON users_lines_intent_bodyparts
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_intent_bodyparts_update_policy" ON users_lines_intent_bodyparts
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_intent_bodyparts_delete_policy" ON users_lines_intent_bodyparts
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "users_lines_belonging_gyms_select_policy" ON users_lines_belonging_gyms
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "users_lines_belonging_gyms_insert_policy" ON users_lines_belonging_gyms
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_belonging_gyms_update_policy" ON users_lines_belonging_gyms
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "users_lines_belonging_gyms_delete_policy" ON users_lines_belonging_gyms
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "status_master_select_policy" ON status_master
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "status_master_insert_policy" ON status_master
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "status_master_update_policy" ON status_master
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "status_master_delete_policy" ON status_master
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );
