-- ============================================================
-- CORALINE NAILS — Schema inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE service_category AS ENUM ('manicure', 'pedicure', 'gel', 'acrilico', 'otro');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status_type AS ENUM ('pending', 'paid');
CREATE TYPE recurrence_type AS ENUM ('none', 'weekly', 'biweekly');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  role        user_role NOT NULL DEFAULT 'employee',
  phone       text,
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── CLIENTS ─────────────────────────────────────────────────
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  phone         text NOT NULL,
  email         text,
  birthdate     date,
  notes         text,
  no_show_count integer NOT NULL DEFAULT 0,
  created_by    uuid NOT NULL REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── SERVICES ────────────────────────────────────────────────
CREATE TABLE services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  price        numeric(10,2) NOT NULL,
  duration_min integer NOT NULL,
  category     service_category NOT NULL DEFAULT 'otro',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── APPOINTMENTS ─────────────────────────────────────────────
CREATE TABLE appointments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id           uuid NOT NULL REFERENCES profiles(id),
  scheduled_at          timestamptz NOT NULL,
  status                appointment_status NOT NULL DEFAULT 'pending',
  payment_status        payment_status_type NOT NULL DEFAULT 'pending',
  notes                 text,
  recurrence_type       recurrence_type NOT NULL DEFAULT 'none',
  recurrence_end_date   date,
  parent_appointment_id uuid REFERENCES appointments(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── APPOINTMENT SERVICES ────────────────────────────────────
CREATE TABLE appointment_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id      uuid NOT NULL REFERENCES services(id),
  price_snapshot  numeric(10,2) NOT NULL
);

-- ─── AGENDA BLOCKS ───────────────────────────────────────────
CREATE TABLE agenda_blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  reason       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── TRANSACTIONS ─────────────────────────────────────────────
CREATE TABLE transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            transaction_type NOT NULL,
  amount          numeric(10,2) NOT NULL,
  description     text NOT NULL,
  category        text NOT NULL DEFAULT 'general',
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  appointment_id  uuid REFERENCES appointments(id),
  employee_id     uuid REFERENCES profiles(id),
  date            date NOT NULL DEFAULT CURRENT_DATE,
  created_by      uuid NOT NULL REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── INVENTORY ───────────────────────────────────────────────
CREATE TABLE inventory (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  quantity   numeric(10,2) NOT NULL DEFAULT 0,
  unit       text NOT NULL DEFAULT 'piezas',
  min_stock  numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── DESIGNS ─────────────────────────────────────────────────
CREATE TABLE designs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  image_url    text NOT NULL,
  tags         text[] NOT NULL DEFAULT '{}',
  uploaded_by  uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── CLIENT PHOTOS ───────────────────────────────────────────
CREATE TABLE client_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  uuid REFERENCES appointments(id),
  image_url       text NOT NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── TASKS ───────────────────────────────────────────────────
CREATE TABLE tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  is_completed  boolean NOT NULL DEFAULT false,
  due_date      date,
  assigned_to   uuid REFERENCES profiles(id),
  created_by    uuid NOT NULL REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── ÍNDICES ────────────────────────────────────────────────
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_employee_id  ON appointments(employee_id);
CREATE INDEX idx_appointments_client_id    ON appointments(client_id);
CREATE INDEX idx_appointments_status       ON appointments(status);
CREATE INDEX idx_clients_created_by        ON clients(created_by);
CREATE INDEX idx_clients_birthdate         ON clients(birthdate);
CREATE INDEX idx_transactions_date         ON transactions(date);
CREATE INDEX idx_transactions_type         ON transactions(type);
CREATE INDEX idx_tasks_due_date            ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_to         ON tasks(assigned_to);
CREATE INDEX idx_designs_tags              ON designs USING gin(tags);

-- ─── TRIGGER: crear profile al registrar usuario ──────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_app_meta_data->>'role')::public.user_role, 'employee')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
