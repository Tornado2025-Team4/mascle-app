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


CREATE POLICY "status_lines_partners_select_policy" ON status_lines_partners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
        OR partner_user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "status_lines_partners_insert_policy" ON status_lines_partners
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_partners_update_policy" ON status_lines_partners
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_partners_delete_policy" ON status_lines_partners
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );


-- メニューマスターテーブルのRLS
CREATE POLICY "menus_master_select_policy" ON menus_master
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "menus_master_insert_policy" ON menus_master
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "menus_master_update_policy" ON menus_master
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "menus_master_delete_policy" ON menus_master
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


-- 有酸素運動メニューマスターテーブルのRLS
CREATE POLICY "menus_cardio_master_select_policy" ON menus_cardio_master
    FOR SELECT
    USING (
        user_rel_id = get_current_user_rel_id()
        -- 本人以外はビュー経由
    );

CREATE POLICY "menus_cardio_master_insert_policy" ON menus_cardio_master
    FOR INSERT
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "menus_cardio_master_update_policy" ON menus_cardio_master
    FOR UPDATE
    USING (
        user_rel_id = get_current_user_rel_id()
    )
    WITH CHECK (
        user_rel_id = get_current_user_rel_id()
    );

CREATE POLICY "menus_cardio_master_delete_policy" ON menus_cardio_master
    FOR DELETE
    USING (
        user_rel_id = get_current_user_rel_id()
    );


-- ステータスメニュー関連テーブルのRLS
CREATE POLICY "status_lines_menus_select_policy" ON status_lines_menus
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_insert_policy" ON status_lines_menus
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_update_policy" ON status_lines_menus
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_delete_policy" ON status_lines_menus
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );


-- ステータス有酸素メニュー関連テーブルのRLS
CREATE POLICY "status_lines_menus_cardio_select_policy" ON status_lines_menus_cardio
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_cardio_insert_policy" ON status_lines_menus_cardio
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_cardio_update_policy" ON status_lines_menus_cardio
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_cardio_delete_policy" ON status_lines_menus_cardio
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM status_master s
            WHERE s.rel_id = status_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );


-- セット詳細テーブルのRLS
CREATE POLICY "status_lines_menus_sets_select_policy" ON status_lines_menus_sets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM status_lines_menus slm
            JOIN status_master s ON s.rel_id = slm.status_rel_id
            WHERE slm.rel_id = status_menu_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_sets_insert_policy" ON status_lines_menus_sets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_lines_menus slm
            JOIN status_master s ON s.rel_id = slm.status_rel_id
            WHERE slm.rel_id = status_menu_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_sets_update_policy" ON status_lines_menus_sets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM status_lines_menus slm
            JOIN status_master s ON s.rel_id = slm.status_rel_id
            WHERE slm.rel_id = status_menu_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_lines_menus slm
            JOIN status_master s ON s.rel_id = slm.status_rel_id
            WHERE slm.rel_id = status_menu_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_sets_delete_policy" ON status_lines_menus_sets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM status_lines_menus slm
            JOIN status_master s ON s.rel_id = slm.status_rel_id
            WHERE slm.rel_id = status_menu_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );


-- 有酸素運動詳細テーブルのRLS
CREATE POLICY "status_lines_menus_cardio_details_select_policy" ON status_lines_menus_cardio_details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM status_lines_menus_cardio slmc
            JOIN status_master s ON s.rel_id = slmc.status_rel_id
            WHERE slmc.rel_id = status_menu_cardio_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_cardio_details_insert_policy" ON status_lines_menus_cardio_details
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_lines_menus_cardio slmc
            JOIN status_master s ON s.rel_id = slmc.status_rel_id
            WHERE slmc.rel_id = status_menu_cardio_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_cardio_details_update_policy" ON status_lines_menus_cardio_details
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM status_lines_menus_cardio slmc
            JOIN status_master s ON s.rel_id = slmc.status_rel_id
            WHERE slmc.rel_id = status_menu_cardio_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_lines_menus_cardio slmc
            JOIN status_master s ON s.rel_id = slmc.status_rel_id
            WHERE slmc.rel_id = status_menu_cardio_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );

CREATE POLICY "status_lines_menus_cardio_details_delete_policy" ON status_lines_menus_cardio_details
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM status_lines_menus_cardio slmc
            JOIN status_master s ON s.rel_id = slmc.status_rel_id
            WHERE slmc.rel_id = status_menu_cardio_rel_id
            AND s.user_rel_id = get_current_user_rel_id()
        )
    );
