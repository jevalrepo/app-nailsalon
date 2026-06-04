export const MIGRATIONS: string[] = [
  // v1 — schema inicial completo
  `
  CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    phone TEXT,
    avatar_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 1,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birthdate TEXT,
    notes TEXT,
    no_show_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 0,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration_min INTEGER NOT NULL,
    category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    applies_surcharge INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 1,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    recurrence_type TEXT NOT NULL DEFAULT 'none',
    recurrence_end_date TEXT,
    parent_appointment_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 0,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS appointment_services (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    price_snapshot REAL NOT NULL,
    _synced INTEGER NOT NULL DEFAULT 0,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    appointment_id TEXT,
    employee_id TEXT,
    date TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 0,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 0,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    uploaded_by TEXT,
    created_at TEXT NOT NULL,
    _synced INTEGER NOT NULL DEFAULT 1,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS design_cache (
    design_id TEXT PRIMARY KEY,
    signed_url TEXT,
    expires_at TEXT,
    local_file_path TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    assigned_to TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 0,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS agenda_blocks (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL,
    _synced INTEGER NOT NULL DEFAULT 1,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS business_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    business_name TEXT,
    phone TEXT,
    address TEXT,
    instagram_handle TEXT,
    open_time TEXT,
    close_time TEXT,
    work_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
    currency TEXT NOT NULL DEFAULT 'MXN',
    off_hours_surcharge REAL NOT NULL DEFAULT 0,
    off_hours_surcharge_type TEXT NOT NULL DEFAULT 'fixed',
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_employee_id ON appointments(employee_id);
  CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment ON appointment_services(appointment_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
  `,

  // v2 — SaaS: columna organization_id en todas las tablas multi-tenant

  `
  ALTER TABLE profiles ADD COLUMN organization_id TEXT;
  ALTER TABLE clients ADD COLUMN organization_id TEXT;
  ALTER TABLE services ADD COLUMN organization_id TEXT;
  ALTER TABLE appointments ADD COLUMN organization_id TEXT;
  ALTER TABLE appointment_services ADD COLUMN organization_id TEXT;
  ALTER TABLE transactions ADD COLUMN organization_id TEXT;
  ALTER TABLE inventory ADD COLUMN organization_id TEXT;
  ALTER TABLE designs ADD COLUMN organization_id TEXT;
  ALTER TABLE tasks ADD COLUMN organization_id TEXT;
  ALTER TABLE agenda_blocks ADD COLUMN organization_id TEXT;
  ALTER TABLE business_config ADD COLUMN organization_id TEXT;

  CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
  CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_org ON transactions(organization_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(organization_id);
  CREATE INDEX IF NOT EXISTS idx_designs_org ON designs(organization_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
  `,

  // v3 — Sucursales: tabla branches + branch_id en tablas operativas
  `
  CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 1,
    _deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_branches_org ON branches(organization_id);

  ALTER TABLE appointments  ADD COLUMN branch_id TEXT;
  ALTER TABLE transactions  ADD COLUMN branch_id TEXT;
  ALTER TABLE inventory     ADD COLUMN branch_id TEXT;
  ALTER TABLE tasks         ADD COLUMN branch_id TEXT;
  ALTER TABLE agenda_blocks ADD COLUMN branch_id TEXT;

  CREATE INDEX IF NOT EXISTS idx_appointments_branch ON appointments(branch_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_branch ON transactions(branch_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_branch    ON inventory(branch_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_branch        ON tasks(branch_id);
  `,

  // v4 — Limpieza de registros sin organization_id para forzar re-sync correcto
  // Se eliminaron porque el pull anterior no incluía organization_id en el SELECT
  `
  DELETE FROM appointments       WHERE organization_id IS NULL;
  DELETE FROM clients            WHERE organization_id IS NULL;
  DELETE FROM services           WHERE organization_id IS NULL;
  DELETE FROM transactions       WHERE organization_id IS NULL;
  DELETE FROM inventory          WHERE organization_id IS NULL;
  DELETE FROM designs            WHERE organization_id IS NULL;
  DELETE FROM tasks              WHERE organization_id IS NULL;
  DELETE FROM appointment_services WHERE appointment_id NOT IN (SELECT id FROM appointments);
  `,

  // v5 — Migrar business_config: id TEXT + organization_id para soporte multi-tenant
  `
  DROP TABLE IF EXISTS business_config;
  CREATE TABLE business_config (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    business_name TEXT,
    phone TEXT,
    address TEXT,
    instagram_handle TEXT,
    open_time TEXT,
    close_time TEXT,
    work_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
    currency TEXT NOT NULL DEFAULT 'MXN',
    off_hours_surcharge REAL NOT NULL DEFAULT 0,
    off_hours_surcharge_type TEXT NOT NULL DEFAULT 'fixed',
    updated_at TEXT,
    _synced INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_business_config_org ON business_config(organization_id);
  `,
];
