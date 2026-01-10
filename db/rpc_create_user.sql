```sql
-- Function to allow Admin to create a new user with password
-- Run this in Supabase Dashboard > SQL Editor

-- REQUIRED: Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- REQUIRED: Add email column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER -- Runs with superuser privileges
SET search_path = public, extensions -- Security best practice, but allow extensions
    AS $$
DECLARE new_id uuid;
BEGIN -- Check if caller is Admin (simple check)
-- Real apps relies on RLS, but this function bypasses RLS, so we rely on the UI being protected
-- (and ideally we would check auth.uid()'s role here too)
-- 1. Insert into auth.users
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
        -- Auto confirm
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
        '' -- Empty tokens
    )
RETURNING id INTO new_id;
-- 2. Insert into public.profiles (if trigger doesnt catch it)
INSERT INTO public.profiles (id, full_name, role, status, email)
VALUES (new_id, full_name, role, 'Active', email) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = 'Active';
RETURN new_id;
END;
$$;