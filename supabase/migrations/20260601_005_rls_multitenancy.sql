-- ============================================================
-- SAAS S2 — RLS Multi-Tenant
-- Reemplaza las políticas de 002_rls.sql y parches posteriores
-- con un modelo basado en membresía a organizaciones.
-- ============================================================

-- ─── FUNCIONES HELPER ─────────────────────────────────────────

-- Retorna los UUIDs de todas las orgs activas del usuario actual.
-- SECURITY INVOKER + search_path vacío para prevenir path hijacking.
-- Se coloca en el schema public pero está protegida: no tiene SECURITY DEFINER.
CREATE OR REPLACE FUNCTION get_my_organizations()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = (SELECT auth.uid())
    AND is_active = true;
$$;

-- Retorna el rol del usuario actual en una org específica (NULL si no es miembro).
CREATE OR REPLACE FUNCTION get_my_org_role(p_org_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND user_id = (SELECT auth.uid())
    AND is_active = true
  LIMIT 1;
$$;

-- Alias de conveniencia: ¿el usuario es owner o admin en la org dada?
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
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

-- ─── DROPEAR POLÍTICAS ANTERIORES ────────────────────────────
-- (002_rls.sql + parches)

DROP POLICY IF EXISTS "profiles_select"          ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all"       ON profiles;

DROP POLICY IF EXISTS "clients_select"           ON clients;
DROP POLICY IF EXISTS "clients_insert"           ON clients;
DROP POLICY IF EXISTS "clients_update"           ON clients;
DROP POLICY IF EXISTS "clients_delete"           ON clients;

DROP POLICY IF EXISTS "services_select"          ON services;
DROP POLICY IF EXISTS "services_admin_write"     ON services;

DROP POLICY IF EXISTS "appointments_select"      ON appointments;
DROP POLICY IF EXISTS "appointments_insert"      ON appointments;
DROP POLICY IF EXISTS "appointments_update"      ON appointments;
DROP POLICY IF EXISTS "appointments_delete"      ON appointments;

DROP POLICY IF EXISTS "appointment_services_select" ON appointment_services;
DROP POLICY IF EXISTS "appointment_services_write"  ON appointment_services;

DROP POLICY IF EXISTS "agenda_blocks_select"     ON agenda_blocks;
DROP POLICY IF EXISTS "agenda_blocks_write"      ON agenda_blocks;

DROP POLICY IF EXISTS "transactions_admin_all"   ON transactions;
DROP POLICY IF EXISTS "transactions_employee_insert" ON transactions;

DROP POLICY IF EXISTS "inventory_select"         ON inventory;
DROP POLICY IF EXISTS "inventory_write"          ON inventory;

DROP POLICY IF EXISTS "designs_select"           ON designs;
DROP POLICY IF EXISTS "designs_insert"           ON designs;
DROP POLICY IF EXISTS "designs_delete"           ON designs;

DROP POLICY IF EXISTS "client_photos_select"     ON client_photos;
DROP POLICY IF EXISTS "client_photos_write"      ON client_photos;

DROP POLICY IF EXISTS "tasks_select"             ON tasks;
DROP POLICY IF EXISTS "tasks_insert"             ON tasks;
DROP POLICY IF EXISTS "tasks_update"             ON tasks;
DROP POLICY IF EXISTS "tasks_delete"             ON tasks;

-- ─── PROFILES ────────────────────────────────────────────────
-- Ver los perfiles activos de tu misma organización.
CREATE POLICY "profiles_select_org" ON profiles
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT get_my_organizations())
  );

-- Cada usuario actualiza únicamente su propio perfil.
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Owner/admin pueden gestionar (crear, ver inactivos, etc.) perfiles de su org.
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── CLIENTS ─────────────────────────────────────────────────
CREATE POLICY "clients_select_org" ON clients
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

CREATE POLICY "clients_insert_org" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND created_by = (SELECT auth.uid())
  );

-- Admin/owner editan cualquier cliente de la org; employee solo los que creó.
CREATE POLICY "clients_update_org" ON clients
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "clients_delete_org" ON clients
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── SERVICES ────────────────────────────────────────────────
CREATE POLICY "services_select_org" ON services
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

CREATE POLICY "services_write_org" ON services
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── APPOINTMENTS ─────────────────────────────────────────────
-- Admin/owner ven todas las citas de la org; employee solo las suyas.
CREATE POLICY "appointments_select_org" ON appointments
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR employee_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "appointments_insert_org" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR employee_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "appointments_update_org" ON appointments
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR employee_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR employee_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "appointments_delete_org" ON appointments
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── APPOINTMENT SERVICES ─────────────────────────────────────
-- Hereda aislamiento vía la cita padre (JOIN implícito).
-- Cualquier miembro de la org puede ver/escribir si ya pasó el check en appointments.
CREATE POLICY "appt_services_select_org" ON appointment_services
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
        AND a.organization_id IN (SELECT get_my_organizations())
    )
  );

CREATE POLICY "appt_services_write_org" ON appointment_services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
        AND a.organization_id IN (SELECT get_my_organizations())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
        AND a.organization_id IN (SELECT get_my_organizations())
    )
  );

-- ─── AGENDA BLOCKS ────────────────────────────────────────────
CREATE POLICY "agenda_blocks_select_org" ON agenda_blocks
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

CREATE POLICY "agenda_blocks_write_org" ON agenda_blocks
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR employee_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR employee_id = (SELECT auth.uid())
    )
  );

-- ─── TRANSACTIONS ─────────────────────────────────────────────
-- Solo admins/owners gestionan finanzas. Employees pueden insertar
-- transacciones automáticas vinculadas a sus citas.
CREATE POLICY "transactions_admin_org" ON transactions
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

CREATE POLICY "transactions_employee_insert_org" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND appointment_id IS NOT NULL
    AND created_by = (SELECT auth.uid())
  );

-- ─── INVENTORY ────────────────────────────────────────────────
CREATE POLICY "inventory_select_org" ON inventory
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

CREATE POLICY "inventory_write_org" ON inventory
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── DESIGNS ──────────────────────────────────────────────────
CREATE POLICY "designs_select_org" ON designs
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

CREATE POLICY "designs_insert_org" ON designs
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND uploaded_by = (SELECT auth.uid())
  );

-- Admin/owner o quien subió la imagen pueden eliminarla.
CREATE POLICY "designs_delete_org" ON designs
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR uploaded_by = (SELECT auth.uid())
    )
  );

-- ─── CLIENT PHOTOS ────────────────────────────────────────────
-- Hereda aislamiento vía el cliente padre.
CREATE POLICY "client_photos_select_org" ON client_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND c.organization_id IN (SELECT get_my_organizations())
    )
  );

CREATE POLICY "client_photos_write_org" ON client_photos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND c.organization_id IN (SELECT get_my_organizations())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND c.organization_id IN (SELECT get_my_organizations())
    )
  );

-- ─── TASKS ────────────────────────────────────────────────────
-- Admin/owner ven todas; employee ve las que creó o le asignaron.
CREATE POLICY "tasks_select_org" ON tasks
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR created_by = (SELECT auth.uid())
      OR assigned_to = (SELECT auth.uid())
    )
  );

CREATE POLICY "tasks_insert_org" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY "tasks_update_org" ON tasks
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR created_by = (SELECT auth.uid())
      OR assigned_to = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR created_by = (SELECT auth.uid())
      OR assigned_to = (SELECT auth.uid())
    )
  );

CREATE POLICY "tasks_delete_org" ON tasks
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND (
      is_org_admin(organization_id)
      OR created_by = (SELECT auth.uid())
    )
  );

-- ─── BUSINESS CONFIG ──────────────────────────────────────────
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

-- Cualquier miembro puede leer la config de su org.
CREATE POLICY "business_config_select_org" ON business_config
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

-- Solo admin/owner pueden modificar la config.
CREATE POLICY "business_config_write_org" ON business_config
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── ORGANIZATIONS ────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Un usuario solo ve las orgs a las que pertenece.
CREATE POLICY "organizations_select_member" ON organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT get_my_organizations()));

-- Solo owners pueden actualizar datos de su org.
CREATE POLICY "organizations_update_owner" ON organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT get_my_organizations())
    AND get_my_org_role(id) = 'owner'
  )
  WITH CHECK (
    id IN (SELECT get_my_organizations())
    AND get_my_org_role(id) = 'owner'
  );

-- Registro de nuevas orgs: lo hace el módulo S4 vía Edge Function con service_role.
-- No se abre INSERT para el rol authenticated aquí.

-- ─── ORGANIZATION MEMBERS ─────────────────────────────────────
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Cualquier miembro activo puede ver los otros miembros de su org.
CREATE POLICY "org_members_select_org" ON organization_members
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

-- Solo owners/admins pueden agregar o desactivar miembros.
CREATE POLICY "org_members_write_org" ON organization_members
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── INVITATIONS ──────────────────────────────────────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins/owners ven las invitaciones de su org.
CREATE POLICY "invitations_select_org" ON invitations
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- Solo admin/owner crean invitaciones.
CREATE POLICY "invitations_insert_org" ON invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- El invitado acepta la invitación actualizando accepted_at (lo hace S7).
-- Por ahora la aceptación se maneja vía Edge Function con service_role.

-- ─── STORAGE — ACTUALIZAR POLÍTICAS A MULTI-TENANT ────────────

-- Drops de las políticas previas de storage (003_storage.sql)
DROP POLICY IF EXISTS "avatars_select_public"     ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"        ON storage.objects;

DROP POLICY IF EXISTS "client_photos_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "client_photos_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "client_photos_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "client_photos_delete_auth" ON storage.objects;

DROP POLICY IF EXISTS "designs_select_auth"       ON storage.objects;
DROP POLICY IF EXISTS "designs_insert_auth"       ON storage.objects;
DROP POLICY IF EXISTS "designs_update_auth"       ON storage.objects;
DROP POLICY IF EXISTS "designs_delete_auth"       ON storage.objects;

-- AVATARS: público para lectura, escritura solo al propio path {userId}/...
-- Los avatares no son por org (son del usuario), se mantiene el patrón original.
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

-- CLIENT PHOTOS: path esperado → client-photos/{orgId}/{clientId}/{fileId}
-- El primer segmento del path es el organization_id.
CREATE POLICY "client_photos_select_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

CREATE POLICY "client_photos_insert_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

CREATE POLICY "client_photos_update_org" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

CREATE POLICY "client_photos_delete_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
    AND is_org_admin((storage.foldername(name))[1]::uuid)
  );

-- DESIGNS: path esperado → designs/{orgId}/{fileId}
-- El primer segmento del path es el organization_id.
CREATE POLICY "designs_select_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'designs'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

CREATE POLICY "designs_insert_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'designs'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

CREATE POLICY "designs_update_org" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'designs'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

CREATE POLICY "designs_delete_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'designs'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_organizations())
  );

-- ─── JWT AUTH HOOK ─────────────────────────────────────────────
-- Inyecta el array de org_ids en el JWT bajo app_metadata.
-- Esto permite validar membresía sin queries adicionales en el cliente.
-- IMPORTANTE: registrar esta función en el Dashboard de Supabase:
--   Authentication > Hooks > Custom Access Token Hook
--   → schema: public, function: custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id  UUID;
  v_org_ids  UUID[];
  v_claims   JSONB;
BEGIN
  v_user_id := (event->>'user_id')::UUID;

  -- Obtener todas las orgs activas del usuario
  SELECT ARRAY_AGG(organization_id)
  INTO v_org_ids
  FROM public.organization_members
  WHERE user_id = v_user_id
    AND is_active = true;

  -- Leer los claims actuales y añadir org_ids en app_metadata
  v_claims := event->'claims';
  v_claims := jsonb_set(
    v_claims,
    '{app_metadata, org_ids}',
    COALESCE(to_jsonb(v_org_ids), '[]'::jsonb),
    true
  );

  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

-- Revocar ejecución pública (SECURITY DEFINER + hook solo lo llama Supabase Auth)
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Ejecutar estas queries después de aplicar la migración:
--
-- 1. Confirmar funciones creadas:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('get_my_organizations','get_my_org_role','is_org_admin','custom_access_token_hook');
--
-- 2. Contar políticas nuevas (debe ser ≥ 30):
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
--
-- 3. Confirmar que no quedan políticas viejas (debe retornar 0 filas):
-- SELECT policyname FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname IN (
--     'profiles_select','profiles_admin_all',
--     'clients_select','services_select','services_admin_write',
--     'appointments_select','transactions_admin_all',
--     'inventory_select','inventory_write',
--     'tasks_select'
--   );
--
-- 4. Confirmar aislamiento (con un segundo usuario en otra org):
-- SELECT * FROM clients;   -- debe retornar solo rows de su propia org
