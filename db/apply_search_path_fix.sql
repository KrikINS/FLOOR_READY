-- ===================================================
-- FINAL CONFIGURATION FIX
-- The "Reset" hid the tools. This reveals them again.
-- ===================================================
-- 1. Grant Permissions (Just to be safe)
GRANT USAGE ON SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres,
    anon,
    authenticated,
    service_role;
-- 2. CRITICAL: Add 'extensions' to the path
-- The previous reset removed this, which is why it broke.
ALTER DATABASE postgres
SET search_path TO public,
    extensions;
ALTER ROLE postgres
SET search_path TO public,
    extensions;
ALTER ROLE authenticator
SET search_path TO public,
    extensions;
ALTER ROLE service_role
SET search_path TO public,
    extensions;
-- 3. Verify
SELECT current_setting('search_path') as new_path;