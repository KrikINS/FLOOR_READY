-- =========================================================
-- DEEP PERMISSION & SEARCH PATH FIX
-- Use this if Login fails with "Database error querying schema"
-- =========================================================
-- 1. Ensure extensions schema exists and is accessible
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- 2. Force pgcrypto into extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
-- Attempt to move it if it's in public (ignore errors if already correct)
DO $$ BEGIN ALTER EXTENSION pgcrypto
SET SCHEMA extensions;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- 3. CRITICAL: Tell Supabase System Roles where to look
-- This fixes the "querying schema" error by adding 'extensions' to the path
ALTER ROLE postgres
SET search_path = public,
    extensions;
ALTER ROLE authenticator
SET search_path = public,
    extensions;
ALTER ROLE service_role
SET search_path = public,
    extensions;
-- 4. Re-Verify the Create User Function matches this setup
CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    extensions AS $$
DECLARE new_id uuid;
BEGIN -- We explicitly use extensions.crypt to be safe
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
        extensions.crypt(password, extensions.gen_salt('bf')),
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
-- 5. Confirmation
SELECT 'Deep Permissions & Search Path Fixed' as status;