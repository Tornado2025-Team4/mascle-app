CREATE POLICY "posts_master_select_policy" ON posts_master
    FOR SELECT
    USING (
        posted_user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "posts_master_insert_policy" ON posts_master
    FOR INSERT
    WITH CHECK (
        posted_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "posts_master_update_policy" ON posts_master
    FOR UPDATE
    USING (
        posted_user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        posted_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "posts_master_delete_policy" ON posts_master
    FOR DELETE
    USING (
        posted_user_rel_id = get_current_user_rel_id()
    );


CREATE POLICY "posts_lines_body_mentions_select_policy" ON posts_lines_body_mentions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_body_mentions.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
        -- 本人以外はビュー経由
    );

CREATE POLICY "posts_lines_body_mentions_insert_policy" ON posts_lines_body_mentions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_body_mentions.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "posts_lines_body_mentions_update_policy" ON posts_lines_body_mentions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_body_mentions.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_body_mentions.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "posts_lines_body_mentions_delete_policy" ON posts_lines_body_mentions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_body_mentions.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );


CREATE POLICY "posts_lines_tags_select_policy" ON posts_lines_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_tags.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
        -- 本人以外はビュー経由
    );

CREATE POLICY "posts_lines_tags_insert_policy" ON posts_lines_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_tags.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "posts_lines_tags_update_policy" ON posts_lines_tags
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_tags.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_tags.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "posts_lines_tags_delete_policy" ON posts_lines_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_tags.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );


CREATE POLICY "posts_lines_photos_select_policy" ON posts_lines_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_photos.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
        -- 本人以外はビュー経由
    );

CREATE POLICY "posts_lines_photos_insert_policy" ON posts_lines_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_photos.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "posts_lines_photos_update_policy" ON posts_lines_photos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_photos.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_photos.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "posts_lines_photos_delete_policy" ON posts_lines_photos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_photos.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );


CREATE POLICY "posts_lines_likes_select_policy" ON posts_lines_likes
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_likes.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
        -- 本人以外はビュー経由
    );

CREATE POLICY "posts_lines_likes_insert_policy" ON posts_lines_likes
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "posts_lines_likes_update_policy" ON posts_lines_likes
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "posts_lines_likes_delete_policy" ON posts_lines_likes
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = posts_lines_likes.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );


CREATE POLICY "comments_master_select_policy" ON comments_master
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = comments_master.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
        -- 本人以外はビュー経由
    );

CREATE POLICY "comments_master_insert_policy" ON comments_master
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "comments_master_update_policy" ON comments_master
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "comments_master_delete_policy" ON comments_master
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
        OR
        EXISTS (
            SELECT 1 FROM posts_master
            WHERE posts_master.rel_id = comments_master.post_rel_id
                AND posts_master.posted_user_rel_id = get_current_user_rel_id()
        )
    );


CREATE POLICY "comments_lines_mentions_select_policy" ON comments_lines_mentions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM comments_master
            WHERE comments_master.rel_id = comments_lines_mentions.comment_rel_id
                AND (
                    comments_master.user_rel_id = get_current_user_rel_id()
                    OR
                    EXISTS (
                        SELECT 1 FROM posts_master
                        WHERE posts_master.rel_id = comments_master.post_rel_id
                            AND posts_master.posted_user_rel_id = get_current_user_rel_id()
                    )
                )
        )
        -- 本人以外はビュー経由
    );

CREATE POLICY "comments_lines_mentions_insert_policy" ON comments_lines_mentions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM comments_master
            WHERE comments_master.rel_id = comments_lines_mentions.comment_rel_id
                AND (
                    comments_master.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "comments_lines_mentions_update_policy" ON comments_lines_mentions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM comments_master
            WHERE comments_master.rel_id = comments_lines_mentions.comment_rel_id
                AND (
                    comments_master.user_rel_id = get_current_user_rel_id()
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM comments_master
            WHERE comments_master.rel_id = comments_lines_mentions.comment_rel_id
                AND (
                    comments_master.user_rel_id = get_current_user_rel_id()
                )
        )
    );

CREATE POLICY "comments_lines_mentions_delete_policy" ON comments_lines_mentions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM comments_master
            WHERE comments_master.rel_id = comments_lines_mentions.comment_rel_id
                AND (
                    comments_master.user_rel_id = get_current_user_rel_id()
                    -- 投稿者が削除する場合は DELETE ON CASCADE で消える
                )
        )
    );
