-- Migration: Add Task Profitability Fields
-- Purpose: Enable linking tasks to cost centers for profitability analysis
-- 1. Add cost_center_id to tasks
ALTER TABLE tasks
ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);
-- 2. Verify
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
    AND column_name = 'cost_center_id';