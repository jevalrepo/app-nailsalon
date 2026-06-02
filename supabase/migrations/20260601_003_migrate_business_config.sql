-- ============================================================
-- SAAS S1 — Migrar business_config a multi-tenant
-- Ejecutar DESPUÉS de 20260601_002_add_org_id_to_tables.sql
-- ============================================================

-- 1. Quitar PK y constraint de fila única (id = 1)
ALTER TABLE business_config DROP CONSTRAINT business_config_pkey;
ALTER TABLE business_config DROP CONSTRAINT business_config_id_check;

-- 2. Cambiar columna id de INTEGER a UUID
ALTER TABLE business_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE business_config ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE business_config ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Agregar organization_id (nullable hasta que corra el seed)
ALTER TABLE business_config ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- 4. Nueva PK sobre el nuevo id UUID
ALTER TABLE business_config ADD PRIMARY KEY (id);

-- 5. Un solo config por organización
CREATE UNIQUE INDEX idx_business_config_org_unique ON business_config(organization_id);
