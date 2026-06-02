-- ============================================================
-- Sucursales (branches) — soporte multi-sucursal por organización
-- Una organización puede tener N sucursales. Los datos compartidos
-- (clientes, servicios, empleadas, galería) permanecen a nivel org.
-- Los datos operativos (citas, finanzas, inventario, tareas, agenda)
-- se asocian a una sucursal específica.
-- ============================================================

-- ─── Tabla branches ────────────────────────────────────────────
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_org ON branches(organization_id);

-- Solo puede haber una sucursal por defecto por org
CREATE UNIQUE INDEX idx_branches_default ON branches(organization_id)
  WHERE is_default = true;

-- ─── branch_id en tablas operativas ────────────────────────────
ALTER TABLE appointments   ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE transactions   ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE inventory      ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE tasks          ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE agenda_blocks  ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_branch ON appointments(branch_id);
CREATE INDEX idx_transactions_branch ON transactions(branch_id);
CREATE INDEX idx_inventory_branch    ON inventory(branch_id);
CREATE INDEX idx_tasks_branch        ON tasks(branch_id);

-- ─── RLS branches ──────────────────────────────────────────────
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Cualquier miembro de la org puede ver las sucursales activas
CREATE POLICY "branches_select_org" ON branches
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_my_organizations()));

-- Solo admin/owner gestionan sucursales
CREATE POLICY "branches_write_org" ON branches
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  )
  WITH CHECK (
    organization_id IN (SELECT get_my_organizations())
    AND is_org_admin(organization_id)
  );

-- ─── Sucursal por defecto para datos existentes ────────────────
-- Crea una sucursal "Principal" para cada org existente y asigna
-- todos los datos operativos sin sucursal a esa sucursal.

DO $$
DECLARE
  r          RECORD;
  v_branch   UUID;
BEGIN
  FOR r IN SELECT id, name FROM organizations LOOP
    -- Crear sucursal por defecto
    INSERT INTO branches (organization_id, name, is_default)
    VALUES (r.id, r.name, true)
    RETURNING id INTO v_branch;

    -- Migrar datos existentes
    UPDATE appointments  SET branch_id = v_branch WHERE organization_id = r.id AND branch_id IS NULL;
    UPDATE transactions  SET branch_id = v_branch WHERE organization_id = r.id AND branch_id IS NULL;
    UPDATE inventory     SET branch_id = v_branch WHERE organization_id = r.id AND branch_id IS NULL;
    UPDATE tasks         SET branch_id = v_branch WHERE organization_id = r.id AND branch_id IS NULL;
    UPDATE agenda_blocks SET branch_id = v_branch WHERE organization_id = r.id AND branch_id IS NULL;

    RAISE NOTICE 'Sucursal creada para org %: % (ID: %)', r.name, r.name, v_branch;
  END LOOP;
END $$;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- SELECT b.name, b.is_default, b.organization_id,
--        COUNT(DISTINCT a.id) AS citas,
--        COUNT(DISTINCT t.id) AS transacciones
-- FROM branches b
-- LEFT JOIN appointments a ON a.branch_id = b.id
-- LEFT JOIN transactions t ON t.branch_id = b.id
-- GROUP BY b.id, b.name, b.is_default, b.organization_id;
