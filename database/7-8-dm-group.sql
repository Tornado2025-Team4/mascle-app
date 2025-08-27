CREATE POLICY "dm_groups_master_select_policy" ON dm_groups_master
    FOR SELECT
    USING (
        NOT is_hidden
        OR
        created_by_user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_master.rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_invites
            WHERE dm_groups_lines_invites.dm_group_rel_id = dm_groups_master.rel_id
                AND dm_groups_lines_invites.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "dm_groups_master_insert_policy" ON dm_groups_master
    FOR INSERT
    WITH CHECK (
        created_by_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_groups_master_update_policy" ON dm_groups_master
    FOR UPDATE
    USING (
        created_by_user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.pub_id = auth.uid()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    )
    WITH CHECK (
        created_by_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_groups_master_delete_policy" ON dm_groups_master
    FOR DELETE
    USING (
        created_by_user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.pub_id = auth.uid()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );


CREATE POLICY "dm_groups_lines_tags_select_policy" ON dm_groups_lines_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND (
                    NOT dm_groups_master.is_hidden
                    OR
                    EXISTS (
                        SELECT 1 FROM dm_groups_lines_members
                        WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                            AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                    )
                    OR
                    EXISTS (
                        SELECT 1 FROM dm_groups_lines_invites
                        WHERE dm_groups_lines_invites.dm_group_rel_id = dm_group_rel_id
                            AND dm_groups_lines_invites.user_rel_id = get_current_user_rel_id()
                    )
                )
        )
    );

CREATE POLICY "dm_groups_lines_tags_insert_policy" ON dm_groups_lines_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_tags_update_policy" ON dm_groups_lines_tags
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_tags_delete_policy" ON dm_groups_lines_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );


CREATE POLICY "dm_groups_lines_members_select_policy" ON dm_groups_lines_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND dm_groups_master.created_by_user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_invites
            WHERE dm_groups_lines_invites.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_invites.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "dm_groups_lines_members_insert_policy" ON dm_groups_lines_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND dm_groups_master.created_by_user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_members_update_policy" ON dm_groups_lines_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND dm_groups_master.created_by_user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND dm_groups_master.created_by_user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_members_delete_policy" ON dm_groups_lines_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND dm_groups_master.created_by_user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );


CREATE POLICY "dm_groups_lines_invites_select_policy" ON dm_groups_lines_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
        )
        OR
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_groups_lines_invites_insert_policy" ON dm_groups_lines_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_invites_update_policy" ON dm_groups_lines_invites
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_invites_delete_policy" ON dm_groups_lines_invites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
        OR
        user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "dm_groups_lines_requests_select_policy" ON dm_groups_lines_requests
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "dm_groups_lines_requests_insert_policy" ON dm_groups_lines_requests
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_groups_lines_requests_update_policy" ON dm_groups_lines_requests
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_groups_lines_requests_delete_policy" ON dm_groups_lines_requests
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );


CREATE POLICY "dm_groups_lines_blocks_select_policy" ON dm_groups_lines_blocks
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_blocks_insert_policy" ON dm_groups_lines_blocks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_blocks_update_policy" ON dm_groups_lines_blocks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );

CREATE POLICY "dm_groups_lines_blocks_delete_policy" ON dm_groups_lines_blocks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );


CREATE POLICY "dm_groups_messages_master_select_policy" ON dm_groups_messages_master
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND (
                    EXISTS (
                        SELECT 1 FROM dm_groups_lines_members
                        WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                            AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                    )
                )
        )
    );

CREATE POLICY "dm_groups_messages_master_insert_policy" ON dm_groups_messages_master
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
        )
        AND
        sent_by_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_groups_messages_master_update_policy" ON dm_groups_messages_master
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_master
            WHERE dm_groups_master.rel_id = dm_group_rel_id
                AND (
                    EXISTS (
                        SELECT 1 FROM dm_groups_lines_members
                        WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                            AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                    )
                )
        )
        AND
        sent_by_user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "dm_groups_messages_master_delete_policy" ON dm_groups_messages_master
    FOR DELETE
    USING (
        (
            EXISTS (
                SELECT 1 FROM dm_groups_master
                WHERE dm_groups_master.rel_id = dm_group_rel_id
                    AND (
                        EXISTS (
                            SELECT 1 FROM dm_groups_lines_members
                            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                        )
                    )
            )
            AND
            sent_by_user_rel_id = get_current_user_rel_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM dm_groups_lines_members
            WHERE dm_groups_lines_members.dm_group_rel_id = dm_group_rel_id
                AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                AND dm_groups_lines_members.is_admin = TRUE
        )
    );


CREATE POLICY "dm_groups_messages_lines_mentions_select_policy" ON dm_groups_messages_lines_mentions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "dm_groups_messages_lines_mentions_insert_policy" ON dm_groups_messages_lines_mentions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "dm_groups_messages_lines_mentions_update_policy" ON dm_groups_messages_lines_mentions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "dm_groups_messages_lines_mentions_delete_policy" ON dm_groups_messages_lines_mentions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );


CREATE POLICY "dm_groups_messages_line_reply_select_policy" ON dm_groups_messages_line_reply
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "dm_groups_messages_line_reply_insert_policy" ON dm_groups_messages_line_reply
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "dm_groups_messages_line_reply_update_policy" ON dm_groups_messages_line_reply
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "dm_groups_messages_line_reply_delete_policy" ON dm_groups_messages_line_reply
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dm_groups_messages_master
            WHERE dm_groups_messages_master.rel_id = dm_group_message_rel_id
                AND EXISTS (
                    SELECT 1 FROM dm_groups_lines_members
                    WHERE dm_groups_lines_members.dm_group_rel_id = dm_groups_messages_master.dm_group_rel_id
                        AND dm_groups_lines_members.user_rel_id = get_current_user_rel_id()
                )
        )
    );
