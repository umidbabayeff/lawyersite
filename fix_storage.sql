-- Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
-- Policy helper
-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
-- IMAGES BUCKET POLICIES
-- 1. Public Read Images
CREATE POLICY "Public Read Images" ON storage.objects FOR
SELECT USING (bucket_id = 'images');
-- 2. Authenticated Upload Images
CREATE POLICY "Authenticated Upload Images" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'images');
-- 3. Owner Update/Delete Images
CREATE POLICY "Owner Update Images" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'images'
        AND auth.uid() = owner
    );
CREATE POLICY "Owner Delete Images" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'images'
    AND auth.uid() = owner
);
-- DOCUMENTS BUCKET POLICIES
-- 1. Public Read Documents (Simplify: allow public read so sharing works easily, or restrict to auth)
-- For now, let's allow Public Read to avoid broken links, but we can restrict if needed.
CREATE POLICY "Public Read Documents" ON storage.objects FOR
SELECT USING (bucket_id = 'documents');
-- 2. Authenticated Upload Documents
CREATE POLICY "Authenticated Upload Documents" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
-- 3. Owner Update/Delete Documents
CREATE POLICY "Owner Update Documents" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'documents'
        AND auth.uid() = owner
    );
CREATE POLICY "Owner Delete Documents" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'documents'
    AND auth.uid() = owner
);