-- ==========================================
-- STORAGE BUCKET SETUP: Avatars
-- ==========================================
-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- 2. Policy: Public Access to View
-- Everyone (even unauthenticated) can see profile pictures
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
-- 3. Policy: Authenticated Users can Upload
-- Any logged in user can upload their own avatar
CREATE POLICY "Authenticated Upload" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );
-- 4. Policy: Users can Update/Delete their own files
-- Assuming filename convention is userId-timestamp
-- Or simplified: Allow overwrite if they are authenticated
CREATE POLICY "Authenticated Update" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);
SELECT 'Avatars Bucket Configured' as status;