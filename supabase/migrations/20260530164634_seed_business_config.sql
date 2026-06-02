-- Insertar fila inicial si no existe (bypass RLS con SET LOCAL)
SET LOCAL row_security = off;
INSERT INTO business_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
SET LOCAL row_security = on;
