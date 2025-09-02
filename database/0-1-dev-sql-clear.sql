-- テーブル削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END$$;

-- ビュー削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE;';
    END LOOP;
END$$;

-- 列挙型削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT t.typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e' LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE;';
    END LOOP;
END$$;

-- トリガー削除（テーブル削除でCASCADEされるが、念のため個別にも）
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public' LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE;';
    END LOOP;
END$$;

-- RLSポリシー削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename) || ';';
    END LOOP;
END$$;