-- Storage policies for the complaints bucket (photo evidence, etc.)
-- Run this in the Supabase SQL Editor after creating the bucket.
--
-- 1. Create the bucket: Dashboard → Storage → New bucket → name "complaints"
-- 2. Set the bucket to Public (bucket settings) so getPublicUrl() works for <img> in the browser.
-- 3. Run ONE of the policies below (public read OR authenticated-only read).

-- Option A: Allow anyone with the link to read (anon + authenticated). Use for public bucket.
CREATE POLICY "Complaints bucket: public read"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'complaints' );

-- Option B (alternative): Only logged-in users can read. Use if bucket is private and you serve signed URLs instead.
-- DROP POLICY IF EXISTS "Complaints bucket: public read" ON storage.objects;
-- CREATE POLICY "Complaints bucket: authenticated read"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING ( bucket_id = 'complaints' );

-- Optional: allow uploads (e.g. from your backend or authenticated clients).
-- CREATE POLICY "Complaints bucket: authenticated insert"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK ( bucket_id = 'complaints' );
