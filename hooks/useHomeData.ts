import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';

function todayRange() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    start: `${dateStr}T00:00:00`,
    end: `${dateStr}T23:59:59`,
    dateStr,
  };
}

export interface TodayAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  client_name: string;
  service_names: string[];
  total_price: number;
}

async function resolveBranch(db: ReturnType<typeof getDb>, orgId: string, branchId: string | null): Promise<string | null> {
  if (branchId) return branchId;
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM branches WHERE organization_id = ? AND _deleted = 0 AND is_active = 1 ORDER BY is_default DESC LIMIT 1',
    [orgId]
  );
  return row?.id ?? null;
}

export function useTodayAppointments() {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { start, end } = todayRange();

  return useQuery({
    queryKey: ['appointments', 'today', orgId, branchId, start],
    enabled: !!orgId,
    queryFn: async () => {
      const db = getDb();
      const resolvedBranchId = await resolveBranch(db, orgId!, branchId);
      if (!resolvedBranchId) return [];

      const appts = await db.getAllAsync<{
        id: string;
        scheduled_at: string;
        status: string;
        client_name: string;
      }>(
        `SELECT a.id, a.scheduled_at, a.status,
                COALESCE(c.name, 'Sin cliente') AS client_name
         FROM appointments a
         LEFT JOIN clients c ON c.id = a.client_id
         WHERE a.organization_id = ? AND a.branch_id = ?
           AND a.scheduled_at >= ? AND a.scheduled_at <= ?
           AND a._deleted = 0
         ORDER BY a.scheduled_at ASC`,
        [orgId!, resolvedBranchId, start, end]
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
        client_name: a.client_name,
        service_names: svcMap[a.id]?.names ?? [],
        total_price: svcMap[a.id]?.total ?? 0,
      })) as TodayAppointment[];
    },
  });
}

export function useTodayIncome() {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { dateStr } = todayRange();

  return useQuery({
    queryKey: ['transactions', 'today-income', orgId, branchId, dateStr],
    enabled: !!orgId,
    queryFn: async () => {
      const db = getDb();
      const resolvedBranchId = await resolveBranch(db, orgId!, branchId);
      if (!resolvedBranchId) return 0;
      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM transactions
         WHERE organization_id = ? AND branch_id = ? AND type = 'income' AND date = ? AND _deleted = 0`,
        [orgId!, resolvedBranchId, dateStr]
      );
      return row?.total ?? 0;
    },
  });
}
