-- ============================================================
-- SAAS S1 — Agregar organization_id a tablas de negocio
-- Ejecutar DESPUÉS de 20260601_001_organizations.sql
-- ============================================================

-- Nullable inicialmente: los datos existentes no tienen org todavía.
-- El seed (004) las llena todas. En S2 se puede poner NOT NULL.
ALTER TABLE profiles       ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE clients        ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE services       ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE appointments   ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE transactions   ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE inventory      ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE designs        ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE tasks          ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE agenda_blocks  ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- appointment_services hereda aislamiento vía appointments (no necesita org_id propio)
-- client_photos hereda aislamiento vía clients (no necesita org_id propio)

-- Índices para performance en queries filtradas por org
CREATE INDEX idx_profiles_org_id      ON profiles(organization_id);
CREATE INDEX idx_clients_org_id       ON clients(organization_id);
CREATE INDEX idx_services_org_id      ON services(organization_id);
CREATE INDEX idx_appointments_org_id  ON appointments(organization_id);
CREATE INDEX idx_transactions_org_id  ON transactions(organization_id);
CREATE INDEX idx_inventory_org_id     ON inventory(organization_id);
CREATE INDEX idx_designs_org_id       ON designs(organization_id);
CREATE INDEX idx_tasks_org_id         ON tasks(organization_id);
CREATE INDEX idx_agenda_blocks_org_id ON agenda_blocks(organization_id);
