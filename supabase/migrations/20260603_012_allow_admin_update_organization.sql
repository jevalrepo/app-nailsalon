-- ============================================================
-- Permitir que owner/admin actualicen datos de la organización
-- Necesario para guardar logo_url desde Datos del negocio.
-- ============================================================

DROP POLICY IF EXISTS "organizations_update_owner" ON organizations;

CREATE POLICY "organizations_update_owner" ON organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT get_my_organizations())
    AND get_my_org_role(id) IN ('owner', 'admin')
  )
  WITH CHECK (
    id IN (SELECT get_my_organizations())
    AND get_my_org_role(id) IN ('owner', 'admin')
  );
