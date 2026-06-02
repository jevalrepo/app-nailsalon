-- Función que devuelve los slots ocupados de un día dado.
-- SECURITY DEFINER permite bypassear RLS para que cualquier
-- empleado autenticado vea los horarios tomados (sin datos sensibles).
CREATE OR REPLACE FUNCTION get_booked_slots(p_date date)
RETURNS TABLE(slot text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT TO_CHAR(
    scheduled_at AT TIME ZONE 'America/Mexico_City',
    'HH24:MI'
  ) AS slot
  FROM appointments
  WHERE DATE(scheduled_at AT TIME ZONE 'America/Mexico_City') = p_date
    AND status IN ('pending', 'confirmed', 'completed');
$$;
