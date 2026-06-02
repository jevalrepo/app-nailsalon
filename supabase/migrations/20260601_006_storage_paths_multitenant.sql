-- ============================================================
-- SAAS S8 — Storage paths multi-tenant (documentación + ajuste)
-- ============================================================
-- Las políticas RLS de Storage ya fueron creadas en 005_rls_multitenancy.sql.
-- Esta migración:
--   1. Documenta las convenciones de paths.
--   2. Corrige la política de DELETE en designs para restringirla
--      a admin/owner o al uploader (espejo de la política en la tabla designs).
-- ============================================================

-- ─── CONVENCIÓN DE PATHS (referencia) ─────────────────────────────────────
--
-- avatars       → {userId}/avatar.{ext}         (público, por usuario)
-- designs       → {orgId}/{userId}/{ts}.{ext}    (privado, por org)
-- client-photos → {orgId}/{clientId}/{ts}.{ext}  (privado, por org)
--
-- El PRIMER segmento del path es la clave de aislamiento:
--   - avatars:       (storage.foldername(name))[1] = auth.uid()::text
--   - designs:       (storage.foldername(name))[1]::uuid IN get_my_organizations()
--   - client-photos: (storage.foldername(name))[1]::uuid IN get_my_organizations()
-- ──────────────────────────────────────────────────────────────────────────

-- ─── AJUSTE: designs DELETE → restringir a admin/owner O uploader ─────────
-- La política anterior (005) permitía DELETE a cualquier miembro de la org.
-- La alineamos con la tabla designs: admin/owner O quien subió el archivo.

DROP POLICY IF EXISTS "designs_delete_org" ON storage.objects;

CREATE POLICY "designs_delete_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'designs'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
    AND (
      is_org_admin((storage.foldername(name))[1]::uuid)
      -- El segundo segmento del path es el userId del uploader
      OR (storage.foldername(name))[2] = (SELECT auth.uid())::text
    )
  );

-- ─── VERIFICACIÓN ─────────────────────────────────────────────────────────
-- Listar todas las políticas de storage.objects tras aplicar la migración:
--
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY policyname;
--
-- Debe mostrar 12 políticas (4 por bucket × 3 buckets):
--   avatars_select_public, avatars_insert_own, avatars_update_own, avatars_delete_own
--   client_photos_select_org, client_photos_insert_org, client_photos_update_org, client_photos_delete_org
--   designs_select_org, designs_insert_org, designs_update_org, designs_delete_org
