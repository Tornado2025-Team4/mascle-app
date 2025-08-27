CREATE POLICY "notices_master_select_policy" ON notices_master
    FOR SELECT
    USING (
        posteduser_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "notices_master_insert_policy" ON notices_master
    FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "notices_master_update_policy" ON notices_master
    FOR UPDATE
    USING (
        posteduser_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        posteduser_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "notices_master_delete_policy" ON notices_master
    FOR DELETE
    USING (
        posteduser_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "notices_lines_mentions_select_policy" ON notices_lines_mentions
    FOR SELECT
    USING (FALSE);

CREATE POLICY "notices_lines_mentions_insert_policy" ON notices_lines_mentions
    FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "notices_lines_mentions_update_policy" ON notices_lines_mentions
    FOR UPDATE
    USING (FALSE)
    WITH CHECK (FALSE);

CREATE POLICY "notices_lines_mentions_delete_policy" ON notices_lines_mentions
    FOR DELETE
    USING (FALSE)
    WITH CHECK (FALSE);
    -- 対象者が削除する場合は DELETE ON CASCADE で消える
