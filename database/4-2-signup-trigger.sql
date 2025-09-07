-- 関連テーブル自動作成

CREATE OR REPLACE FUNCTION create_users_master_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_anon_pub_id CHAR(22);
    new_handle VARCHAR(31);
    try_count INTEGER := 0;
    user_rel_id BIGINT;
BEGIN
    WHILE try_count < 3 LOOP
        new_anon_pub_id := '~' || public.gen_nanoid_21();
        new_handle := '@' || public.gen_nanoid_21_no_symbols();
        BEGIN
            INSERT INTO public.users_master (pub_id, anon_pub_id, handle)
            VALUES (NEW.id, new_anon_pub_id, new_handle)
            RETURNING rel_id INTO user_rel_id;

            INSERT INTO public.users_line_profile (user_rel_id)
            VALUES (user_rel_id);

            INSERT INTO public.users_line_config (user_rel_id)
            VALUES (user_rel_id);

            INSERT INTO public.users_line_privacy (user_rel_id)
            VALUES (user_rel_id);

            INSERT INTO public.users_line_privacy_anon (user_rel_id)
            VALUES (user_rel_id);

            RETURN NEW;
        EXCEPTION WHEN unique_violation THEN
            try_count := try_count + 1;
            -- リトライ
        END;
    END LOOP;
    RAISE EXCEPTION 'Failed to generate unique anon_pub_id or handle after 3 attempts';

END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- トリガー登録
DROP TRIGGER IF EXISTS trg_create_users_master_on_signup ON auth.users;

CREATE TRIGGER trg_create_users_master_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_users_master_on_signup();

-- nanoidを生成する関数
CREATE OR REPLACE FUNCTION gen_nanoid_21() RETURNS text AS $$
DECLARE
    chars CONSTANT text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
    result text := '';
    i integer := 0;
    idx integer;
BEGIN
    FOR i IN 1..21 LOOP
        idx := (get_byte(public.gen_random_bytes(1), 0) % 64) + 1;
        result := result || substr(chars, idx, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 記号なしのnanoidを生成する関数
CREATE OR REPLACE FUNCTION gen_nanoid_21_no_symbols() RETURNS text AS $$
DECLARE
    chars CONSTANT text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    result text := '';
    i integer := 0;
    idx integer;
BEGIN
    FOR i IN 1..21 LOOP
        idx := (get_byte(public.gen_random_bytes(1), 0) % 62) + 1;
        result := result || substr(chars, idx, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
