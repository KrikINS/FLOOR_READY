-- =========================================================
-- EMERGENCY RESET SCRIPT
-- Reverts configuration to "Factory Defaults" to fix Login
-- =========================================================
-- 1. Reset Search Paths (Undo previous strict settings)
ALTER DATABASE postgres RESET search_path;
ALTER ROLE postgres RESET search_path;
ALTER ROLE authenticator RESET search_path;
ALTER ROLE service_role RESET search_path;
-- 2. Move pgcrypto BACK to 'public' (The most compatible location)
-- We try to move it from extensions. If it fails, we make sure it exists in public.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
DO $$ BEGIN ALTER EXTENSION pgcrypto
SET SCHEMA public;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- 3. Fix the User Creator Function
-- Updated to use 'crypt' directly (from public) instead of 'extensions.crypt'
CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER -- We assume public is in the path by default now
    AS $$
DECLARE new_id uuid;
BEGIN
INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    )
VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email,
        crypt(password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        json_build_object(
            'full_name',
            full_name,
            'role',
            role,
            'status',
            'Active'
        ),
        NOW(),
        NOW(),
        '',
        ''
    )
RETURNING id INTO new_id;
INSERT INTO public.profiles (id, full_name, role, status, email)
VALUES (new_id, full_name, role, 'Active', email) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = 'Active',
    email = EXCLUDED.email;
RETURN new_id;
END;
$$;
-- 4. Status Check
SELECT 'System Reset to defaults. pgcrypto in public.' as status;