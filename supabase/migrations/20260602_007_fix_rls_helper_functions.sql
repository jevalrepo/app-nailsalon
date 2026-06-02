-- ============================================================
-- SAAS Fix — Corregir funciones helper de RLS a SECURITY DEFINER
-- Problema: SECURITY INVOKER causaba recursión infinita al leer
-- organization_members, cuya política RLS llama a get_my_organizations().
-- Solución: SECURITY DEFINER permite que la función omita RLS al
-- consultar la tabla, rompiendo el ciclo. La seguridad se mantiene
-- porque la función ya filtra por auth.uid() internamente.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_organizations()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = (SELECT auth.uid())
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION get_my_org_role(p_org_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND user_id = (SELECT auth.uid())
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- Revocar ejecución pública y otorgar a authenticated (igual que custom_access_token_hook)
REVOKE EXECUTE ON FUNCTION public.get_my_organizations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_org_role(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Confirmar que las 3 funciones ahora son SECURITY DEFINER:
--
-- SELECT routine_name, security_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('get_my_organizations', 'get_my_org_role', 'is_org_admin');
--
-- Debe retornar security_type = 'DEFINER' para las 3.
