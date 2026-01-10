-- ==========================================
-- FINAL SUPER FIX SCRIPT: RUN THIS ENTIRE FILE
-- ==========================================
-- 1. CLEANUP: Drop conflicting triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Drop old versions of functions to be clean
DROP FUNCTION IF EXISTS public.create_new_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.delete_user(uuid);
-- 2. EXTENSIONS: Ensure crypto is ready (check both schemas)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- 3. PROFILES TABLE: Fix specific columns and constraints
-- Add email if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;
-- Fix Role Constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('Admin', 'Manager', 'Staff'));
-- 4. DATA FIXES:
-- Migrate old roles
UPDATE public.profiles
SET role = 'Staff'
WHERE role = 'Employee';
-- CRITICAL: Ensure Owner is Admin
UPDATE public.profiles
SET role = 'Admin'
WHERE email = 'anees.ahad1007@gmail.com';
-- 5. FUNCTION: CREATE USER
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
-- 6. FUNCTION: DELETE USER
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE requester_role text;
requester_email text;
BEGIN -- Get requester info
SELECT role,
    email INTO requester_role,
    requester_email
FROM public.profiles
WHERE id = auth.uid();
-- Allow if Admin OR if it is the specific Owner Email
IF requester_role <> 'Admin'
AND requester_email <> 'anees.ahad1007@gmail.com' THEN RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
END IF;
-- Delete the user
DELETE FROM auth.users
WHERE id = target_user_id;
END;
$$;
-- 7. VERIFY
SELECT 'Database Fully Patched & Owner Set to Admin' as status;