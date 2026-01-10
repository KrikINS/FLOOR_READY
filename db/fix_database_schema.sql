-- ==========================================
-- SUPER FIX SCRIPT: RUN THIS ENTIRE FILE
-- ==========================================
-- 1. CLEANUP: Drop conflicting triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_new_user(text, text, text, text);
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
-- Migrate old roles
UPDATE public.profiles
SET role = 'Staff'
WHERE role = 'Employee';
-- 4. RE-CREATE RPC FUNCTION (Robust Version)
CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER -- Search path includes extensions to find pgcrypto
SET search_path = public,
    extensions AS $$
DECLARE new_id uuid;
BEGIN -- Insert into auth system
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
-- Insert into public profiles
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
-- 5. VERIFY: Return confirmation
SELECT 'Database Successfully Patched' as status;