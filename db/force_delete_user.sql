-- ==========================================
-- FORCE DELETE ZOMBIE USER
-- Run this in SQL Editor to bypass Dashboard errors
-- ==========================================
-- 1. Switch to Superuser role (just in case)
SET ROLE postgres;
-- 2. Force Delete by Email
-- This bypasses the API and Dashboard logic
DELETE FROM auth.users
WHERE email = 'anees.ahad@outlook.com';
-- 3. Verify it's gone
SELECT email,
    id
FROM auth.users
WHERE email = 'anees.ahad@outlook.com';