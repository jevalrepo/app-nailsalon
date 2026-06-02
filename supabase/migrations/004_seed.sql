-- ============================================================
-- CORALINE NAILS — Seed de datos de prueba
-- ⚠️  Ejecutar DESPUÉS de crear el primer usuario admin en Auth
-- Reemplaza 'TU_USER_ID' con el UUID del usuario admin
-- ============================================================

-- Servicios de ejemplo
INSERT INTO services (name, description, price, duration_min, category, is_active) VALUES
  ('Manicure clásica',      'Limpieza, forma y esmalte',               180, 45,  'manicure', true),
  ('Manicure semipermanente','Esmalte gel de larga duración',           280, 60,  'manicure', true),
  ('Pedicure clásico',      'Limpieza, exfoliación y esmalte',         220, 60,  'pedicure', true),
  ('Pedicure spa',          'Pedicure clásico + masaje + hidratación', 320, 90,  'pedicure', true),
  ('Uñas de gel',           'Extensiones o capping en gel',            450, 90,  'gel',      true),
  ('Uñas acrílicas',        'Extensiones en acrílico',                 500, 120, 'acrilico', true),
  ('Nail art (diseño)',     'Diseño decorativo por uña',                50, 15,  'otro',     true);

-- Inventario de ejemplo
INSERT INTO inventory (name, quantity, unit, min_stock) VALUES
  ('Esmalte semipermanente',  24, 'piezas',   5),
  ('Base coat',               5,  'piezas',   2),
  ('Top coat',                4,  'piezas',   2),
  ('Acetona',                 1000, 'ml',     200),
  ('Gel builder',             3,  'tubos',    1),
  ('Polvo acrílico',          500, 'g',       100),
  ('Monómero',                500, 'ml',      100),
  ('Limas de uñas',           20, 'piezas',   5),
  ('Papel aluminio',          100,'piezas',   20),
  ('Guantes de látex',        50, 'pares',    10);
