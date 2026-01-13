-- =========================================================
-- ULTIMATE PERMISSION FIX
-- Purpose: Open up all tables for viewing to ensure Joins work
-- =========================================================
-- 1. PROFILES: Allow EVERYONE to read ALL profiles (needed for Assignee names)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON profiles;
CREATE POLICY "Public read access" ON profiles FOR
SELECT USING (true);
-- 2. EVENTS: Allow EVERYONE to read ALL events (needed for Event names)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON events;
CREATE POLICY "Public read access" ON events FOR
SELECT USING (true);
-- 3. TASKS: Allow EVERYONE to read ALL tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON tasks;
CREATE POLICY "Public read access" ON tasks FOR
SELECT USING (true);
CREATE POLICY "Auth insert access" ON tasks FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 4. VERIFY DATA (This confirms what the App should see)
SELECT t.id,
    t.title,
    p.full_name as assignee_name,
    e.name as event_name
FROM tasks t
    LEFT JOIN profiles p ON t.assignee_id = p.id
    LEFT JOIN events e ON t.event_id = e.id
LIMIT 5;