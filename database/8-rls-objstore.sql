CREATE POLICY "objstore_select_policy" ON storage.objects
    FOR SELECT
    USING (FALSE); -- APIによる制御が前提


CREATE POLICY "objstore_insert_policy" ON storage.objects
    FOR INSERT
    WITH CHECK (
        (
            bucket_id IN ('gymchains_icons', 'gyms_photos')
            AND FALSE
        )
        OR
        (
            bucket_id = 'users_icons'
            AND auth.uid() IS NOT NULL
        )
        OR
        (
            bucket_id IN ('posts_photos', 'posts_photos_thumb')
            AND auth.uid() IS NOT NULL
        )
        OR
        (
            bucket_id = 'notices_icons'
            AND FALSE
        )
        OR
        (
            bucket_id = 'dm_groups_icons'
            AND auth.uid() IS NOT NULL
        )
    );


CREATE POLICY "objstore_update_policy" ON storage.objects
    FOR UPDATE
    USING (
        (
            bucket_id IN ('gymchains_icons', 'gyms_photos')
            AND FALSE
        )
        OR
        (
            bucket_id = 'users_icons'
            AND EXISTS (
                SELECT 1 FROM users_line_profile
                WHERE users_line_profile.user_rel_id = get_current_user_rel_id()
                    AND users_line_profile.icon_rel_id = storage.objects.id
            )
        )
        OR
        (
            bucket_id IN ('posts_photos', 'posts_photos_thumb')
            AND EXISTS (
                SELECT 1 FROM posts_lines_photos plp
                JOIN posts_master pm ON pm.rel_id = plp.post_rel_id
                WHERE (plp.photo_rel_id = storage.objects.id OR plp.photo_thumb_rel_id = storage.objects.id)
                    AND pm.posted_user_rel_id = get_current_user_rel_id()
            )
        )
        OR
        (
            bucket_id = 'notices_icons'
            AND FALSE
        )
        OR
        (
            bucket_id = 'dm_groups_icons'
            AND EXISTS (
                SELECT 1 FROM user_dm_groups udg
                JOIN user_dm_group_members udgm ON udgm.group_rel_id = udg.rel_id
                WHERE udg.icon_rel_id = storage.objects.id
                    AND udgm.user_rel_id = get_current_user_rel_id()
                    AND udgm.is_admin = TRUE
            )
        )
    )
    WITH CHECK (
        (
            bucket_id IN ('gymchains_icons', 'gyms_photos')
            AND FALSE
        )
        OR
        (
            bucket_id = 'users_icons'
            AND auth.uid() IS NOT NULL
        )
        OR
        (
            bucket_id IN ('posts_photos', 'posts_photos_thumb')
            AND auth.uid() IS NOT NULL
        )
        OR
        (
            bucket_id = 'notices_icons'
            AND FALSE
        )
        OR
        (
            bucket_id = 'dm_groups_icons'
            AND auth.uid() IS NOT NULL
        )
    );


CREATE POLICY "objstore_delete_policy" ON storage.objects
    FOR DELETE
    USING (
        (
            bucket_id IN ('gymchains_icons', 'gyms_photos')
            AND FALSE
        )
        OR
        (
            bucket_id = 'users_icons'
            AND EXISTS (
                SELECT 1 FROM users_line_profile
                WHERE users_line_profile.user_rel_id = get_current_user_rel_id()
                    AND users_line_profile.icon_rel_id = storage.objects.id
            )
        )
        OR
        (
            bucket_id IN ('posts_photos', 'posts_photos_thumb')
            AND EXISTS (
                SELECT 1 FROM posts_lines_photos plp
                JOIN posts_master pm ON pm.rel_id = plp.post_rel_id
                WHERE (plp.photo_rel_id = storage.objects.id OR plp.photo_thumb_rel_id = storage.objects.id)
                    AND pm.posted_user_rel_id = get_current_user_rel_id()
            )
        )
        OR
        (
            bucket_id = 'notices_icons'
            AND FALSE
        )
        OR
        (
            bucket_id = 'dm_groups_icons'
            AND EXISTS (
                SELECT 1 FROM user_dm_groups udg
                JOIN user_dm_group_members udgm ON udgm.group_rel_id = udg.rel_id
                WHERE udg.icon_rel_id = storage.objects.id
                    AND udgm.user_rel_id = get_current_user_rel_id()
                    AND udgm.is_admin = TRUE
            )
        )
    );
