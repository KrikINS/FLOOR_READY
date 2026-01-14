-- 1. Create the table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN ('Cash', 'Cheque', 'Transfer', 'Card', 'Other')
    ),
    cheque_number TEXT,
    cheque_date DATE,
    status TEXT NOT NULL CHECK (
        status IN ('Pending', 'Cleared', 'Bounce', 'Cancelled')
    ) DEFAULT 'Pending',
    task_id UUID REFERENCES public.tasks(id),
    vendor TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Enable Row Level Security (RLS) - safe to run even if already enabled
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- 3. Drop existing policies to avoid name collisions when re-running
DROP POLICY IF EXISTS "Allow generic select for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.expenses;
-- 4. Re-create Policies
-- Allow authenticated users to view all expenses
CREATE POLICY "Allow generic select for authenticated users" ON public.expenses FOR
SELECT TO authenticated USING (true);
-- Allow authenticated users to insert expenses
CREATE POLICY "Allow insert for authenticated users" ON public.expenses FOR
INSERT TO authenticated WITH CHECK (true);
-- Allow authenticated users to update expenses
CREATE POLICY "Allow update for authenticated users" ON public.expenses FOR
UPDATE TO authenticated USING (true);
-- Allow authenticated users to delete expenses
CREATE POLICY "Allow delete for authenticated users" ON public.expenses FOR DELETE TO authenticated USING (true);