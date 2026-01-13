-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true) ON CONFLICT (id) DO NOTHING;
-- 2. Storage Policies
-- Allow Authenticated uploads
CREATE POLICY "Authenticated Users can upload attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'task-attachments');
-- Allow Public read (or authenticated)
CREATE POLICY "Authenticated Users can read attachments" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'task-attachments');
-- 3. Create Attachments Tracking Table
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES profiles(id),
    context TEXT CHECK (context IN ('creation', 'submission', 'comment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
-- 4. RLS for Attachments Table
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view attachments" ON task_attachments FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can upload attachments" ON task_attachments FOR
INSERT WITH CHECK (auth.uid() = uploaded_by);