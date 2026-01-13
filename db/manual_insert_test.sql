-- User instructions: Replace 'Admin' with your role if different, or just run to leverage current auth (if running in SQL editor with RLS context).
-- Ideally, run this in the Supabase Dashboard SQL Editor.
DO $$
DECLARE v_event_id uuid;
v_user_id uuid;
BEGIN -- 1. Get an active event (create one if none exists)
SELECT id INTO v_event_id
FROM events
LIMIT 1;
IF v_event_id IS NULL THEN
INSERT INTO events (name, description, status)
VALUES (
        'Debug Event',
        'Created for testing task insert',
        'Active'
    )
RETURNING id INTO v_event_id;
END IF;
-- 2. Get current user ID (works in SQL Editor)
v_user_id := auth.uid();
-- 3. Insert Task
INSERT INTO tasks (
        event_id,
        title,
        description,
        priority,
        status,
        assignee_id
    )
VALUES (
        v_event_id,
        'Manual SQL Task',
        'This task was inserted directly via SQL to test RLS.',
        'High',
        'Not Started',
        v_user_id
    );
RAISE NOTICE 'Task inserted successfully for Event ID: %',
v_event_id;
END $$;