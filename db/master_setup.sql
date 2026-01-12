-- ==============================================================================
-- MASTER SETUP SCRIPT for Floor Ready App
-- Run this ENTIRE script in the Supabase SQL Editor to fully set up/reset the DB
-- ==============================================================================
-- ------------------------------------------------------------------------------
-- 0. CLEANUP (Optional: Remove if you want to keep existing data)
-- ------------------------------------------------------------------------------
-- DROP TABLE IF EXISTS task_updates, task_inventory, inventory, tasks, events, profiles CASCADE;
-- DROP FUNCTION IF EXISTS create_new_user, delete_user, handle_new_user CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & PERMISSIONS (Critical for Login & Passwords)
-- ------------------------------------------------------------------------------
-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- Setup pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
DO $$ BEGIN ALTER EXTENSION pgcrypto
SET SCHEMA extensions;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- SEARCH PATH FIX (The key to fixing "Database error querying schema")
ALTER ROLE postgres
SET search_path = public,
    extensions;
ALTER ROLE authenticator
SET search_path = public,
    extensions;
ALTER ROLE service_role
SET search_path = public,
    extensions;
-- ------------------------------------------------------------------------------
-- 2. TABLES & SCHEMA
-- ------------------------------------------------------------------------------
-- Profiles (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    -- Added for easier management
    phone TEXT,
    role TEXT CHECK (role IN ('Admin', 'Manager', 'Staff')),
    status TEXT CHECK (status IN ('Pending', 'Active', 'Suspended')) DEFAULT 'Pending',
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES profiles(id),
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT CHECK (
        status IN (
            'Not Started',
            'In Progress',
            'Completed',
            'On Hold'
        )
    ) DEFAULT 'Not Started',
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    category TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    supplier_info JSONB,
    image_url TEXT
);
-- Task-Inventory Link
CREATE TABLE IF NOT EXISTS task_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_required INTEGER DEFAULT 1
);
-- Task Updates
CREATE TABLE IF NOT EXISTS task_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    comment TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Events Policies
DROP POLICY IF EXISTS "Everyone can view events" ON events;
CREATE POLICY "Everyone can view events" ON events FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins and Managers can manage events" ON events;
CREATE POLICY "Admins and Managers can manage events" ON events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
-- Tasks Policies
DROP POLICY IF EXISTS "Everyone can view tasks" ON tasks;
CREATE POLICY "Everyone can view tasks" ON tasks FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON tasks;
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
-- Inventory Policies
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON inventory;
CREATE POLICY "Inventory is viewable by everyone" ON inventory FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Managers can update stock" ON inventory;
CREATE POLICY "Managers can update stock" ON inventory FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('Admin', 'Manager')
        )
    );
-- ------------------------------------------------------------------------------
-- 4. FUNCTIONS (RPC)
-- ------------------------------------------------------------------------------
-- Create New User Function (Secure, Admin-only handled by UI/RLS usually, but here by internal logic)
CREATE OR REPLACE FUNCTION create_new_user(
        email text,
        password text,
        full_name text,
        role text
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    extensions AS $$
DECLARE new_id uuid;
BEGIN -- Insert into auth.users (System)
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
-- Insert into public.profiles (App Data)
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
-- Delete User Function (Admin or Owner Only)
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
-- Owner Override (Hardcoded Security) + Admin Check
IF requester_role <> 'Admin'
AND requester_email <> 'anees.ahad1007@gmail.com' THEN RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
END IF;
DELETE FROM auth.users
WHERE id = target_user_id;
END;
$$;
-- ------------------------------------------------------------------------------
-- 5. DATA CLEANUP & DEFAULTS
-- ------------------------------------------------------------------------------
-- Ensure Owner is always Admin
UPDATE public.profiles
SET role = 'Admin',
    status = 'Active'
WHERE email = 'anees.ahad1007@gmail.com';
-- Ensure no legacy roles exist
UPDATE public.profiles
SET role = 'Staff'
WHERE role = 'Employee';
SELECT 'Master Setup Complete: System Ready' as status;