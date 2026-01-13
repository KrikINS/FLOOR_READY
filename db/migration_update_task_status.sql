-- Migration: Update Task Statuses
-- Purpose: Support new interactive workflow
-- 1. Drop the old check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
-- 2. Update existing 'Not Started' tasks to 'Pending' (Transition plan)
UPDATE tasks
SET status = 'Pending'
WHERE status = 'Not Started';
-- 3. Add new check constraint
ALTER TABLE tasks
ADD CONSTRAINT tasks_status_check CHECK (
        status IN (
            'Pending',
            'Acknowledged',
            'In Review',
            'In Progress',
            'Awaiting Approval',
            'Completed',
            'On Hold'
        )
    );
-- 4. Verify
SELECT DISTINCT status
FROM tasks;