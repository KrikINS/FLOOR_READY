-- =========================================================
-- NUCLEAR RESET SCRIPT (WIPE & REBUILD)
-- WARNING: THIS DELETES ALL USERS AND PROFILES
-- =========================================================
-- 1. DROP EVERYTHING (Clean Slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_new_user(text, text, text, text);
DROP FUNCTION IF EXISTS delete_user(uuid);
DROP TABLE IF EXISTS public.profiles CASCADE;
-- 2. RESET EXTENSIONS & PERMISSIONS (Standard Supabase Setup)
-- Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- Force pgcrypto to extensions (where it belongs)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
DO $$ BEGIN ALTER EXTENSION pgcrypto
SET SCHEMA extensions;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- RESET Search Paths to Defaults (Crucial for Login to work normally)
ALTER DATABASE postgres RESET search_path;
ALTER ROLE postgres RESET search_path;
ALTER ROLE authenticator RESET search_path;
ALTER ROLE service_role RESET search_path;
-- 3. RE-CREATE PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('Admin', 'Manager', 'Staff')),
    status TEXT CHECK (status IN ('Pending', 'Active', 'Suspended')) DEFAULT 'Pending',
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- 4. RE-CREATE USER CREATION FUNCTION (Robust & Explicit)
-- This function explicitly uses extensions.crypt to avoid search_path ambiguity
CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER -- We specify the path explicitly here to be safe within the function
SET search_path = public,
    extensions AS $$
DECLARE new_id uuid;
BEGIN -- Insert into auth.users using explicit schema references
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
-- Insert into profiles
INSERT INTO public.profiles (id, full_name, role, status, email)
VALUES (new_id, full_name, role, 'Active', email);
RETURN new_id;
END;
$$;
-- 5. RE-CREATE DELETE FUNCTION
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE requester_role text;
requester_email text;
BEGIN
SELECT role,
    email INTO requester_role,
    requester_email
FROM public.profiles
WHERE id = auth.uid();
-- Hardcoded Owner Override + Admin Check
IF requester_role <> 'Admin'
AND requester_email <> 'anees.ahad1007@gmail.com' THEN RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
END IF;
DELETE FROM auth.users
WHERE id = target_user_id;
END;
$$;
SELECT 'User Management Reset Complete.' as status;
-- 6. RESTORE DOMAIN PERMISSIONS (Events, Tasks, Inventory)
-- These are often dropped when profiles is dropped via CASCADE, so we must restore them.
-- EVENTS
DROP POLICY IF EXISTS "Everyone can view events" ON events;
DROP POLICY IF EXISTS "Admins and Managers can manage events" ON events;
CREATE POLICY "Everyone can view events" ON events FOR
SELECT USING (true);
CREATE POLICY "Admins and Managers can manage events" ON events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
-- TASKS
DROP POLICY IF EXISTS "Everyone can view tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins and Managers can manage tasks" ON tasks;
CREATE POLICY "Everyone can view tasks" ON tasks FOR
SELECT USING (true);
CREATE POLICY "Employees can update assigned tasks" ON tasks FOR
UPDATE USING (
        assignee_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('Admin', 'Manager')
        )
    );
CREATE POLICY "Admins and Managers can manage tasks" ON tasks FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
-- INVENTORY
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON inventory;
DROP POLICY IF EXISTS "Managers can update stock" ON inventory;
CREATE POLICY "Inventory is viewable by everyone" ON inventory FOR
SELECT USING (true);
CREATE POLICY "Managers can update stock" ON inventory FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
SELECT 'SYSTEM FULLY REBUILT: Auth & Domain Logic Ready.' as status;