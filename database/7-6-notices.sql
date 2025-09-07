CREATE POLICY "notices_master_select_policy" ON notices_master
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM notices_lines_assigned_users
            WHERE notices_lines_assigned_users.notice_rel_id = notices_master.rel_id
                AND notices_lines_assigned_users.target_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "notices_master_insert_policy" ON notices_master
    FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "notices_master_update_policy" ON notices_master
    FOR UPDATE
    USING (FALSE)
    WITH CHECK (FALSE);

CREATE POLICY "notices_master_delete_policy" ON notices_master
    FOR DELETE
    USING (FALSE);


CREATE POLICY "notices_lines_assigned_users_select_policy" ON notices_lines_assigned_users
    FOR SELECT
    USING (
        target_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "notices_lines_assigned_users_insert_policy" ON notices_lines_assigned_users
    FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "notices_lines_assigned_users_update_policy" ON notices_lines_assigned_users
    FOR UPDATE
    USING (
        target_user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        target_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "notices_lines_assigned_users_delete_policy" ON notices_lines_assigned_users
    FOR DELETE
    USING (
        target_user_rel_id = get_current_user_rel_id()
    );
