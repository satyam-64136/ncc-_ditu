-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET POLICIES
-- Run this AFTER you've created the "ncc-media" bucket via:
--   Supabase Dashboard → Storage → New bucket → name: ncc-media → Public bucket: ON
--
-- A public bucket lets anyone READ files (needed so photos show up
-- on your live site), but by default nobody can UPLOAD to it yet —
-- these policies open up uploads/updates/deletes for the app.
-- Same reasoning as supabase_schema.sql: the actual security boundary
-- is Flask's own admin-login check, not Supabase's RLS.
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Public read access ncc-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'ncc-media');

CREATE POLICY "Public upload access ncc-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ncc-media');

CREATE POLICY "Public update access ncc-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ncc-media');

CREATE POLICY "Public delete access ncc-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'ncc-media');
