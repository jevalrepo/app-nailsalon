-- ============================================================
-- Logo por organización
-- Agrega logo_url a organizations + políticas de storage para
-- el bucket logos (path: logos/{orgId}/logo.{ext})
-- ============================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Storage: políticas para bucket logos (público para lectura)
-- El bucket se crea vía API; aquí solo las RLS policies.

CREATE POLICY "logos_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Solo owner/admin de la org puede subir/actualizar su logo.
-- Path esperado: logos/{orgId}/logo.{ext}
-- El primer segmento del path es el organization_id.
CREATE POLICY "logos_insert_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND is_org_admin((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "logos_update_org" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND is_org_admin((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "logos_delete_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND is_org_admin((storage.foldername(name))[1]::uuid)
  );
