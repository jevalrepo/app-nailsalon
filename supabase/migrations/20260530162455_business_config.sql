-- ─── BUSINESS CONFIG ─────────────────────────────────────────
-- Fila única por negocio (id siempre = 1)
CREATE TABLE business_config (
  id                  integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name       text NOT NULL DEFAULT 'Coraline Nails',
  phone               text NOT NULL DEFAULT '',
  address             text NOT NULL DEFAULT '',
  instagram_handle    text NOT NULL DEFAULT '',
  open_time           text NOT NULL DEFAULT '09:00',
  close_time          text NOT NULL DEFAULT '18:00',
  work_days           integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  currency            text NOT NULL DEFAULT 'MXN',
  off_hours_surcharge numeric(10,2) NOT NULL DEFAULT 0,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- work_days: array de enteros 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
-- off_hours_surcharge: monto fijo en moneda local que se suma al total fuera de horario

ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read business config"
  ON business_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin can upsert business config"
  ON business_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Fila inicial con valores por defecto
INSERT INTO business_config (id) VALUES (1);
