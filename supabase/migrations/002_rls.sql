-- ============================================================
-- CORALINE NAILS — Row Level Security
-- Ejecutar en: Supabase Dashboard > SQL Editor (después del 001)
-- ============================================================

-- Helper: obtener rol del usuario actual desde profiles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- ─── PROFILES ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado ve todos los perfiles activos (necesario para asignar citas)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Solo el propio usuario puede actualizar su perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Solo admin puede ver perfiles inactivos y crear nuevos
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

-- ─── CLIENTS ─────────────────────────────────────────────────
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden ver y crear clientes
CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Admin puede todo; employee solo edita clientes que creó
CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'admin'
    OR created_by = (SELECT auth.uid())
  );

CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ─── SERVICES ────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select" ON services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "services_admin_write" ON services
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- ─── APPOINTMENTS ─────────────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Admin ve todas; employee solo las suyas
CREATE POLICY "appointments_select" ON appointments
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    OR employee_id = (SELECT auth.uid())
  );

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    OR employee_id = (SELECT auth.uid())
  );

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR employee_id = (SELECT auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'admin'
    OR employee_id = (SELECT auth.uid())
  );

CREATE POLICY "appointments_delete" ON appointments
  FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ─── APPOINTMENT SERVICES ────────────────────────────────────
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_services_select" ON appointment_services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "appointment_services_write" ON appointment_services
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── AGENDA BLOCKS ───────────────────────────────────────────
ALTER TABLE agenda_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agenda_blocks_select" ON agenda_blocks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "agenda_blocks_write" ON agenda_blocks
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'admin'
    OR employee_id = (SELECT auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'admin'
    OR employee_id = (SELECT auth.uid())
  );

-- ─── TRANSACTIONS ─────────────────────────────────────────────
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Solo admin ve y gestiona finanzas
CREATE POLICY "transactions_admin_all" ON transactions
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- ─── INVENTORY ───────────────────────────────────────────────
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_select" ON inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_write" ON inventory
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- ─── DESIGNS ─────────────────────────────────────────────────
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "designs_select" ON designs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "designs_insert" ON designs
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = (SELECT auth.uid()));

CREATE POLICY "designs_delete" ON designs
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR uploaded_by = (SELECT auth.uid())
  );

-- ─── CLIENT PHOTOS ───────────────────────────────────────────
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_photos_select" ON client_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "client_photos_write" ON client_photos
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── TASKS ───────────────────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Admin ve todas; employee ve las propias o las asignadas a él
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    OR created_by = (SELECT auth.uid())
    OR assigned_to = (SELECT auth.uid())
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR created_by = (SELECT auth.uid())
    OR assigned_to = (SELECT auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'admin'
    OR created_by = (SELECT auth.uid())
    OR assigned_to = (SELECT auth.uid())
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    OR created_by = (SELECT auth.uid())
  );
