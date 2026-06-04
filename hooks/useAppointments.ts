import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export interface AppointmentListItem {
  id: string;
  scheduled_at: string;
  status: string;
  payment_status: string;
  client_name: string;
  service_names: string[];
  total_price: number;
}

export interface AppointmentCalendarMonth {
  appointmentDates: string[];
  birthdayDates: string[];
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthRange(year: number, month: number) {
  const start = toLocalDateString(new Date(year, month, 1));
  const end = toLocalDateString(new Date(year, month + 1, 0));
  return { start, end };
}

export function useAppointmentsByDate(date: string) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();

  return useQuery({
    queryKey: ['appointments', 'by-date', orgId, branchId, date],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const startTs = `${date}T00:00:00`;
      const endTs = `${date}T23:59:59`;

      // Resolver branchId: usar el activo o, si no hay, la única sucursal de la org
      let resolvedBranchId = branchId;
      if (!resolvedBranchId) {
        const row = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM branches WHERE organization_id = ? AND _deleted = 0 AND is_active = 1 ORDER BY is_default DESC LIMIT 1',
          [orgId!]
        );
        resolvedBranchId = row?.id ?? null;
      }

      const appts = await db.getAllAsync<{
        id: string;
        scheduled_at: string;
        status: string;
        payment_status: string;
        client_name: string;
      }>(
        resolvedBranchId
          ? `SELECT a.id, a.scheduled_at, a.status, a.payment_status,
                    COALESCE(c.name, 'Sin cliente') AS client_name
             FROM appointments a
             LEFT JOIN clients c ON c.id = a.client_id
             WHERE a.organization_id = ? AND a.branch_id = ?
               AND a.scheduled_at >= ? AND a.scheduled_at <= ?
               AND a._deleted = 0
             ORDER BY a.scheduled_at ASC`
          : `SELECT a.id, a.scheduled_at, a.status, a.payment_status,
                    COALESCE(c.name, 'Sin cliente') AS client_name
             FROM appointments a
             LEFT JOIN clients c ON c.id = a.client_id
             WHERE a.organization_id = ?
               AND a.scheduled_at >= ? AND a.scheduled_at <= ?
               AND a._deleted = 0
             ORDER BY a.scheduled_at ASC`,
        resolvedBranchId
          ? [orgId!, resolvedBranchId, startTs, endTs]
          : [orgId!, startTs, endTs]
      );

      if (appts.length === 0) return [];

      const ids = appts.map((a) => a.id);
      const placeholders = ids.map(() => '?').join(',');
      const services = await db.getAllAsync<{
        appointment_id: string;
        service_name: string;
        price_snapshot: number;
      }>(
        `SELECT as_.appointment_id,
                COALESCE(s.name, '') AS service_name,
                as_.price_snapshot
         FROM appointment_services as_
         LEFT JOIN services s ON s.id = as_.service_id
         WHERE as_.appointment_id IN (${placeholders})`,
        ids
      );

      const svcMap: Record<string, { names: string[]; total: number }> = {};
      for (const svc of services) {
        if (!svcMap[svc.appointment_id]) svcMap[svc.appointment_id] = { names: [], total: 0 };
        svcMap[svc.appointment_id].names.push(svc.service_name);
        svcMap[svc.appointment_id].total += svc.price_snapshot ?? 0;
      }

      return appts.map((a) => ({
        id: a.id,
        scheduled_at: a.scheduled_at,
        status: a.status,
        payment_status: a.payment_status,
        client_name: a.client_name,
        service_names: svcMap[a.id]?.names ?? [],
        total_price: svcMap[a.id]?.total ?? 0,
      })) as AppointmentListItem[];
    },
  });
}

export interface BookedSlot {
  start_slot: string; // 'HH:MM'
  duration_min: number;
}

export function useBookedSlots(date: string) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();

  return useQuery({
    queryKey: ['appointments', 'booked-slots', orgId, branchId, date],
    enabled: !!orgId && !!date,
    queryFn: async () => {
      const db = getDb();

      let resolvedBranchId = branchId;
      if (!resolvedBranchId) {
        const row = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM branches WHERE organization_id = ? AND _deleted = 0 AND is_active = 1 ORDER BY is_default DESC LIMIT 1',
          [orgId!]
        );
        resolvedBranchId = row?.id ?? null;
      }
      if (!resolvedBranchId) return [];

      const rows = await db.getAllAsync<{ scheduled_at: string; total_duration_min: number }>(
        `SELECT a.scheduled_at,
                COALESCE(SUM(s.duration_min), 0) AS total_duration_min
         FROM appointments a
         JOIN appointment_services as_ ON as_.appointment_id = a.id
         JOIN services s ON s.id = as_.service_id
         WHERE a.organization_id = ? AND a.branch_id = ?
           AND date(a.scheduled_at) = date(?)
           AND a.status NOT IN ('cancelled', 'no_show')
           AND a._deleted = 0
         GROUP BY a.id`,
        [orgId!, resolvedBranchId, date]
      );

      return rows.map((row) => {
        const localDate = new Date(row.scheduled_at);
        const hh = String(localDate.getHours()).padStart(2, '0');
        const mm = String(localDate.getMinutes()).padStart(2, '0');
        return {
          start_slot: `${hh}:${mm}`,
          duration_min: row.total_duration_min,
        };
      }) as BookedSlot[];
    },
  });
}

export function useAppointmentCalendarMonth(year: number, month: number) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['appointments', 'calendar-month', orgId, branchId, year, month],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();

      let resolvedBranchId = branchId;
      if (!resolvedBranchId) {
        const row = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM branches WHERE organization_id = ? AND _deleted = 0 AND is_active = 1 ORDER BY is_default DESC LIMIT 1',
          [orgId!]
        );
        resolvedBranchId = row?.id ?? null;
      }

      const [apptRows, clientRows] = await Promise.all([
        resolvedBranchId
          ? db.getAllAsync<{ scheduled_at: string }>(
              `SELECT scheduled_at FROM appointments
               WHERE organization_id = ? AND branch_id = ?
                 AND scheduled_at >= ? AND scheduled_at <= ?
                 AND _deleted = 0`,
              [orgId!, resolvedBranchId, `${start}T00:00:00`, `${end}T23:59:59`]
            )
          : Promise.resolve([]),
        db.getAllAsync<{ birthdate: string }>(
          `SELECT birthdate FROM clients
           WHERE organization_id = ? AND birthdate IS NOT NULL AND _deleted = 0`,
          [orgId!]
        ),
      ]);

      const appointmentDates = [
        ...new Set(apptRows.map((r) => r.scheduled_at.slice(0, 10))),
      ];

      const birthdayDates = [
        ...new Set(
          clientRows
            .map((r) => r.birthdate)
            .filter((b) => {
              const [, bMonth] = b.split('-');
              return Number(bMonth) === month + 1;
            })
            .map((b) => {
              const [, , bDay] = b.split('-');
              return `${year}-${String(month + 1).padStart(2, '0')}-${bDay}`;
            })
        ),
      ];

      return { appointmentDates, birthdayDates } as AppointmentCalendarMonth;
    },
  });
}

export function useAppointmentById(id: string) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['appointment', orgId, id],
    enabled: !!orgId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const appt = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT a.id, a.scheduled_at, a.status, a.payment_status, a.notes,
                a.client_id, a.employee_id, a.recurrence_type, a.created_at,
                COALESCE(c.name, 'Sin cliente') AS client_name,
                COALESCE(p.full_name, '') AS employee_name
         FROM appointments a
         LEFT JOIN clients c ON c.id = a.client_id
         LEFT JOIN profiles p ON p.id = a.employee_id
         WHERE a.id = ? AND a.organization_id = ? AND a._deleted = 0`,
        [id, orgId!]
      );
      if (!appt) throw new Error('Appointment not found');

      const services = await db.getAllAsync<{
        id: string;
        service_id: string;
        service_name: string;
        price_snapshot: number;
      }>(
        `SELECT as_.id, as_.service_id,
                COALESCE(s.name, '') AS service_name,
                as_.price_snapshot
         FROM appointment_services as_
         LEFT JOIN services s ON s.id = as_.service_id
         WHERE as_.appointment_id = ?`,
        [id]
      );

      return { ...appt, services };
    },
  });
}
