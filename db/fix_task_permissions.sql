-- Allow any authenticated user to create tasks
-- This fixes the issue where non-Admin/Manager users (or users with missing roles) cannot create tasks.
CREATE POLICY "Authenticated users can create tasks" ON tasks FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Ensure uuid-ossp is available (usually is, but good to be safe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Verify the user's role
SELECT id,
    email,
    role
FROM profiles
WHERE id = auth.uid();