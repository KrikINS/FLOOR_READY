-- Fix Missing Foreign Key for Assignee
-- This enables PostgREST to join tasks with profiles
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE tasks
ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE
SET NULL;
-- Verify it was added
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'tasks'
    AND constraint_type = 'FOREIGN KEY';