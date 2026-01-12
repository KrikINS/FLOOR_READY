-- ==========================================
-- FINAL LOGIN FIX: USE EXTENSIONS SCHEMA
-- ==========================================
-- 1. Ensure 'extensions' exists
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- 2. Move pgcrypto to 'extensions' (Supabase Standard)
-- We try to create it there. If it exists in public, we move it.
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
DO $$ BEGIN ALTER EXTENSION pgcrypto
SET SCHEMA extensions;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- 3. CRITICAL: Grant Execute Permissions
-- The error "querying schema" often means "I can't run this function"
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- 4. CRITICAL: Fix Search Path for Auth System
-- This tells Supabase Auth "Look in 'extensions' for pgcrypto"
ALTER DATABASE postgres
SET search_path TO public,
    extensions;
ALTER ROLE authenticator
SET search_path = public,
    extensions;
ALTER ROLE service_role
SET search_path = public,
    extensions;
ALTER ROLE postgres
SET search_path = public,
    extensions;
-- 5. Update our Helper Function to match
CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    extensions AS $$
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
SELECT 'Login Fix Applied: pgcrypto is in extensions' as status;