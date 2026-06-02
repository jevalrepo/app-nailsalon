DROP FUNCTION IF EXISTS get_booked_slots(date);

CREATE OR REPLACE FUNCTION get_booked_slots(p_date date)
RETURNS TABLE(start_slot text, duration_min int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    TO_CHAR(a.scheduled_at AT TIME ZONE 'America/Mexico_City', 'HH24:MI') AS start_slot,
    COALESCE(SUM(s.duration_min), 30)::int AS duration_min
  FROM appointments a
  LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
  LEFT JOIN services s ON s.id = aps.service_id
  WHERE DATE(a.scheduled_at AT TIME ZONE 'America/Mexico_City') = p_date
    AND a.status IN ('pending', 'confirmed', 'completed')
  GROUP BY a.id, a.scheduled_at;
$$;
