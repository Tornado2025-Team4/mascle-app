CREATE POLICY "dm_pairs_master_select_policy" ON dm_pairs_master
    FOR SELECT
    USING (
        user_a_rel_id = get_current_user_rel_id()
        OR
        user_b_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_pairs_master_insert_policy" ON dm_pairs_master
    FOR INSERT
    WITH CHECK (
        user_a_rel_id = get_current_user_rel_id()
        OR
        user_b_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_pairs_master_update_policy" ON dm_pairs_master
    FOR UPDATE
    USING (
        user_a_rel_id = get_current_user_rel_id()
        OR
        user_b_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_a_rel_id = get_current_user_rel_id()
        OR
        user_b_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "dm_pairs_master_delete_policy" ON dm_pairs_master
    FOR DELETE
    USING (
        user_a_rel_id = get_current_user_rel_id()
        OR
        user_b_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "dm_pair_messages_master_select_policy" ON dm_pair_messages_master
    FOR SELECT
    USING (
        dm_pair_rel_id IN (
            SELECT rel_id FROM dm_pairs_master
            WHERE user_a_rel_id = get_current_user_rel_id()
                OR user_b_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "dm_pair_messages_master_insert_policy" ON dm_pair_messages_master
    FOR INSERT
    WITH CHECK (
        sent_user_rel_id = get_current_user_rel_id()
        AND
        dm_pair_rel_id IN (
            SELECT rel_id FROM dm_pairs_master
            WHERE (user_a_rel_id = get_current_user_rel_id() OR user_b_rel_id = get_current_user_rel_id())
                AND user_a_allowed = TRUE
                AND user_b_allowed = TRUE
        )
    );

CREATE POLICY "dm_pair_messages_master_update_policy" ON dm_pair_messages_master
    FOR UPDATE
    USING (
        sent_user_rel_id = get_current_user_rel_id()
        AND
        dm_pair_rel_id IN (
            SELECT rel_id FROM dm_pairs_master
            WHERE (user_a_rel_id = get_current_user_rel_id() OR user_b_rel_id = get_current_user_rel_id())
                AND user_a_allowed = TRUE
                AND user_b_allowed = TRUE
        )
    )
    WITH CHECK (
        sent_user_rel_id = get_current_user_rel_id()
        AND
        dm_pair_rel_id IN (
            SELECT rel_id FROM dm_pairs_master
            WHERE (user_a_rel_id = get_current_user_rel_id() OR user_b_rel_id = get_current_user_rel_id())
                AND user_a_allowed = TRUE
                AND user_b_allowed = TRUE
        )
    );

CREATE POLICY "dm_pair_messages_master_delete_policy" ON dm_pair_messages_master
    FOR DELETE
    USING (
        sent_user_rel_id = get_current_user_rel_id()
        AND
        dm_pair_rel_id IN (
            SELECT rel_id FROM dm_pairs_master
            WHERE (user_a_rel_id = get_current_user_rel_id() OR user_b_rel_id = get_current_user_rel_id())
                AND user_a_allowed = TRUE
                AND user_b_allowed = TRUE
        )
    );


CREATE POLICY "dm_pair_messages_lines_mentions_select_policy" ON dm_pair_messages_lines_mentions
    FOR SELECT
    USING (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );

CREATE POLICY "dm_pair_messages_lines_mentions_insert_policy" ON dm_pair_messages_lines_mentions
    FOR INSERT
    WITH CHECK (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );

CREATE POLICY "dm_pair_messages_lines_mentions_update_policy" ON dm_pair_messages_lines_mentions
    FOR UPDATE
    USING (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    )
    WITH CHECK (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );

CREATE POLICY "dm_pair_messages_lines_mentions_delete_policy" ON dm_pair_messages_lines_mentions
    FOR DELETE
    USING (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );


CREATE POLICY "dm_pair_messages_line_reply_select_policy" ON dm_pair_messages_line_reply
    FOR SELECT
    USING (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );

CREATE POLICY "dm_pair_messages_line_reply_insert_policy" ON dm_pair_messages_line_reply
    FOR INSERT
    WITH CHECK (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );

CREATE POLICY "dm_pair_messages_line_reply_update_policy" ON dm_pair_messages_line_reply
    FOR UPDATE
    USING (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    )
    WITH CHECK (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );

CREATE POLICY "dm_pair_messages_line_reply_delete_policy" ON dm_pair_messages_line_reply
    FOR DELETE
    USING (
        message_rel_id IN (
            SELECT rel_id FROM dm_pair_messages_master
            WHERE dm_pair_rel_id IN (
                SELECT rel_id FROM dm_pairs_master
                WHERE user_a_rel_id = get_current_user_rel_id()
                    OR user_b_rel_id = get_current_user_rel_id()
            )
        )
    );
