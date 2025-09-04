CREATE POLICY "users_master_select_policy" ON users_master
    FOR SELECT
    USING (
        pub_id = auth.uid()
        -- 本人以外はViewやService経由で参照
    );

CREATE POLICY "users_master_insert_policy" ON users_master
    FOR INSERT
    WITH CHECK (
        pub_id = auth.uid()
    );

CREATE POLICY "users_master_update_policy" ON users_master
    FOR UPDATE
    USING (
        pub_id = auth.uid()
    )
    WITH CHECK (
        pub_id = auth.uid()
    );

CREATE POLICY "users_master_delete_policy" ON users_master
    FOR DELETE
    USING (
        pub_id = auth.uid()
    );


CREATE POLICY "tags_master_select_policy" ON tags_master
    FOR SELECT
    USING (TRUE);

CREATE POLICY "tags_master_insert_policy" ON tags_master
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "tags_master_update_policy" ON tags_master
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (TRUE);

CREATE POLICY "tags_master_delete_policy" ON tags_master
    FOR DELETE
    USING (FALSE);


CREATE POLICY "intents_master_select_policy" ON intents_master
    FOR SELECT
    USING (TRUE);

CREATE POLICY "intents_master_insert_policy" ON intents_master
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "intents_master_update_policy" ON intents_master
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (TRUE);

CREATE POLICY "intents_master_delete_policy" ON intents_master
    FOR DELETE
    USING (FALSE);


CREATE POLICY "bodyparts_master_select_policy" ON bodyparts_master
    FOR SELECT
    USING (TRUE);

CREATE POLICY "bodyparts_master_insert_policy" ON bodyparts_master
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "bodyparts_master_update_policy" ON bodyparts_master
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (TRUE);

CREATE POLICY "bodyparts_master_delete_policy" ON bodyparts_master
    FOR DELETE
    USING (FALSE);


CREATE POLICY "gymchains_master_select_policy" ON gymchains_master
    FOR SELECT
    USING (TRUE);

CREATE POLICY "gymchains_master_insert_policy" ON gymchains_master
    FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "gymchains_master_update_policy" ON gymchains_master
    FOR UPDATE
    USING (FALSE)
    WITH CHECK (FALSE);

CREATE POLICY "gymchains_master_delete_policy" ON gymchains_master
    FOR DELETE
    USING (FALSE);


CREATE POLICY "gyms_master_select_policy" ON gyms_master
    FOR SELECT
    USING (TRUE);

CREATE POLICY "gyms_master_insert_policy" ON gyms_master
    FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "gyms_master_update_policy" ON gyms_master
    FOR UPDATE
    USING (FALSE)
    WITH CHECK (FALSE);

CREATE POLICY "gyms_master_delete_policy" ON gyms_master
    FOR DELETE
    USING (FALSE);
