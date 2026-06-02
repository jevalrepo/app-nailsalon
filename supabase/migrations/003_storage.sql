-- ============================================================
-- CORALINE NAILS — Storage buckets y políticas
-- Ejecutar en: Supabase Dashboard > SQL Editor (después del 002)
-- ============================================================

-- ─── BUCKETS ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',       'avatars',       true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('client-photos', 'client-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('designs',       'designs',       false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

-- ─── AVATARS (público) ───────────────────────────────────────
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ─── CLIENT PHOTOS (privado, solo autenticados) ──────────────
CREATE POLICY "client_photos_select_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-photos');

CREATE POLICY "client_photos_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-photos');

CREATE POLICY "client_photos_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'client-photos');

CREATE POLICY "client_photos_delete_auth" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-photos');

-- ─── DESIGNS (privado, solo autenticados) ────────────────────
CREATE POLICY "designs_select_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'designs');

CREATE POLICY "designs_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'designs');

CREATE POLICY "designs_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'designs');

CREATE POLICY "designs_delete_auth" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'designs');
