-- Add Profitability Columns to Tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS cost_to_client NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'Piece',
    ADD COLUMN IF NOT EXISTS billable_quantity NUMERIC DEFAULT 1,
    ADD COLUMN IF NOT EXISTS profitability_comments TEXT;
-- Verify columns
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'tasks';