-- =========================================================
-- DIAGNOSTIC SCRIPT: CHECK PERMISSIONS AND INSERT
-- =========================================================
-- 1. Check your own user details (Run this in Supabase SQL Editor)
select auth.uid() as your_auth_id,
    p.id as profile_id,
    p.email,
    p.role
from profiles p
where p.id = auth.uid();
-- 2. Check if you can verify RLS is enabled
select tablename,
    rowsecurity
from pg_tables
where schemaname = 'public'
    and tablename = 'tasks';
-- 3. Attempt a Direct Insert (This will fail if RLS blocks it, giving a clear error)
-- Replace 'YOUR_EVENT_ID' with a real event ID from your 'events' table if known, 
-- or stick to dynamic values if you are running this as a test block.
-- This block is just for syntax checking; the real test is running it.
DO $$
DECLARE v_user_id uuid := auth.uid();
v_event_id uuid;
BEGIN -- Get the first event ID found
SELECT id INTO v_event_id
FROM events
LIMIT 1;
IF v_event_id IS NOT NULL THEN
INSERT INTO tasks (
        event_id,
        title,
        description,
        assignee_id,
        priority,
        status
    )
VALUES (
        v_event_id,
        'Test Task SQL',
        'Created via SQL Editor',
        v_user_id,
        'Medium',
        'Not Started'
    );
RAISE NOTICE 'Test task created successfully';
ELSE RAISE NOTICE 'No events found to attach task to';
END IF;
END $$;