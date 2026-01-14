-- Create expense_requests table
CREATE TABLE IF NOT EXISTS public.expense_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Task', 'Miscellaneous')),
    task_id UUID REFERENCES public.tasks(id) ON DELETE
    SET NULL,
        description TEXT,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending' CHECK (
            status IN (
                'Pending',
                'Approved',
                'Rejected',
                'Paid_Confirmed',
                'Changes_Requested'
            )
        ),
        attachment_url TEXT,
        requester_comments TEXT,
        rejection_reason TEXT
);
-- Enable Row Level Security
ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;
-- Policies
-- 1. View Policies
CREATE POLICY "Users can view their own requests" ON public.expense_requests FOR
SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Admins and Managers can view all requests" ON public.expense_requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('Admin', 'Manager')
        )
    );
-- 2. Insert Policies
CREATE POLICY "Users can create requests" ON public.expense_requests FOR
INSERT WITH CHECK (auth.uid() = requester_id);
-- 3. Update Policies
CREATE POLICY "Users can update their own requests" ON public.expense_requests FOR
UPDATE USING (auth.uid() = requester_id);
CREATE POLICY "Admins and Managers can update any request" ON public.expense_requests FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('Admin', 'Manager')
        )
    );
-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_expense_requests_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_expense_requests_updated_at BEFORE
UPDATE ON public.expense_requests FOR EACH ROW EXECUTE PROCEDURE update_expense_requests_updated_at();