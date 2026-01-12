-- ===================================================
-- EXTREME REPAIR SCRIPT
-- 1. Cleans up Extensions
-- 2. Fixes Permissions
-- 3. Deletes Zombie Users
-- ===================================================
-- 1. DELETE PROBLEMATIC USERS (Clear the conflict)
DELETE FROM auth.users
WHERE email = 'anees.ahad@outlook.com';
DELETE FROM auth.users
WHERE email = 'anees.ahad1007@gmail.com';
-- 2. NUKE & RE-INSTALL PGCRYPTO (Ensure it's fresh and in the right place)
-- We drop it cascade to remove any bad links
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
-- Create schema if missing
CREATE SCHEMA IF NOT EXISTS extensions;
-- Install correctly
CREATE EXTENSION pgcrypto SCHEMA extensions;
-- 3. GRANT PERMISSIONS (Open Access for System Roles)
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- 4. FIX SEARCH PATHS (The Map to find the tools)
ALTER DATABASE postgres
SET search_path TO public,
    extensions;
-- Apply to Roles (Critical)
ALTER ROLE authenticator
SET search_path TO public,
    extensions;
ALTER ROLE service_role
SET search_path TO public,
    extensions;
ALTER ROLE postgres
SET search_path TO public,
    extensions;
-- 5. VERIFICATION
SELECT extensions.gen_salt('bf') as test_salt;