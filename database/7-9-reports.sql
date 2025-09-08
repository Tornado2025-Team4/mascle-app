CREATE POLICY "reports_master_select_policy" ON reports_master
    FOR SELECT
    USING (
        reporter_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "reports_master_insert_policy" ON reports_master
    FOR INSERT
    WITH CHECK (
        reporter_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "reports_master_update_policy" ON reports_master
    FOR UPDATE
    USING (
        reporter_user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        reporter_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "reports_master_delete_policy" ON reports_master
    FOR DELETE
    USING (
        reporter_user_rel_id = get_current_user_rel_id()
    );
