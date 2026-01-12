-- ==========================================
-- FINAL FIX: EXTENSION LOCATION
-- ==========================================
-- 1. Create 'extensions' schema if missing (standard Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;
-- 2. Grant access to this schema
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- 3. Move 'pgcrypto' to 'extensions' (where Supabase expects it)
-- If this errors, it might already be there, which is fine.
BEGIN;
ALTER EXTENSION pgcrypto
SET SCHEMA extensions;
EXCEPTION
WHEN undefined_object THEN -- If it didn't exist, create it now
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
WHEN OTHERS THEN -- If it fails for other reasons (like "already in extensions"), ignore
NULL;
END;
-- 4. Ensure our 'create_new_user' function still works
-- We update it to be explicit about using extensions.crypt
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
SELECT 'Extensions Fixed' as status;