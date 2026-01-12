-- ==========================================
-- FIX ADMIN UPDATE POLICY
-- Issue: Admins could usually only update themselves.
-- Fix: Allow Admins to update ANY profile.
-- ==========================================
-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- 2. Create a comprehensive Update Policy
-- Allows update if:
-- A) It is your own profile
-- OR
-- B) You are an Admin (checked via subquery)
CREATE POLICY "Users can update own profile OR Admin can update all" ON profiles FOR
UPDATE USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'Admin'
        )
    );
SELECT 'Admin Update Policy Fixed' as status;