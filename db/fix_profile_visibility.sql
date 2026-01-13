-- Ensure Profiles are viewable so Task Joins work
-- If the app tries to fetch Task + Profile Name, and Profile is blocked, it might fail or return empty.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Drop verify policy to avoid duplicates if re-running
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
-- Create basic read policy for profiles
CREATE POLICY "Everyone can view profiles" ON profiles FOR
SELECT USING (true);
-- Verify it worked
SELECT count(*)
FROM profiles;