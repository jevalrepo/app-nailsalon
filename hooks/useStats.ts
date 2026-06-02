import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';

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

export interface MonthlyRevenue {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TopService {
  service_id: string;
  name: string;
  count: number;
  total_revenue: number;
}

export interface TopClient {
  client_id: string;
  name: string;
  visits: number;
  total_spent: number;
}

export interface StatsSummary {
  total_clients: number;
  total_appointments: number;
  completed_appointments: number;
  no_show_count: number;
  month_income: number;
  month_expenses: number;
  month_net: number;
  completion_rate: number;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function useMonthlyRevenue(months = 6) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();

  return useQuery({
    queryKey: ['stats', 'monthly-revenue', orgId, branchId, months],
    enabled: !!orgId && !!branchId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const db = getDb();
      const now = new Date();
      const results: MonthlyRevenue[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        const { start, end } = monthRange(year, month);

        const row = await db.getFirstAsync<{ income: number; expenses: number }>(
          `SELECT
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
           FROM transactions
           WHERE organization_id = ? AND branch_id = ? AND date >= ? AND date <= ? AND _deleted = 0`,
          [orgId!, branchId!, start, end]
        );

        const income = row?.income ?? 0;
        const expenses = row?.expenses ?? 0;
        results.push({ year, month, label: MONTH_LABELS[month], income, expenses, net: income - expenses });
      }

      return results;
    },
  });
}

export function useTopServices(year: number, month: number, limit = 5) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['stats', 'top-services', orgId, branchId, year, month],
    enabled: !!orgId && !!branchId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<{
        service_id: string;
        name: string;
        count: number;
        total_revenue: number;
      }>(
        `SELECT s.id AS service_id, s.name,
                COUNT(*) AS count,
                COALESCE(SUM(as_.price_snapshot), 0) AS total_revenue
         FROM appointment_services as_
         JOIN services s ON s.id = as_.service_id
         JOIN appointments a ON a.id = as_.appointment_id
         WHERE a.organization_id = ? AND a.branch_id = ?
           AND a.scheduled_at >= ? AND a.scheduled_at <= ?
           AND a.status = 'completed'
           AND a._deleted = 0
         GROUP BY s.id
         ORDER BY count DESC
         LIMIT ?`,
        [orgId!, branchId!, `${start}T00:00:00`, `${end}T23:59:59`, limit]
      );
      return rows as TopService[];
    },
  });
}

export function useTopClients(year: number, month: number, limit = 5) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['stats', 'top-clients', orgId, branchId, year, month],
    enabled: !!orgId && !!branchId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<{
        client_id: string;
        name: string;
        visits: number;
        total_spent: number;
      }>(
        `SELECT c.id AS client_id, c.name,
                COUNT(*) AS visits,
                COALESCE(SUM(as_.price_snapshot), 0) AS total_spent
         FROM appointments a
         JOIN clients c ON c.id = a.client_id
         LEFT JOIN appointment_services as_ ON as_.appointment_id = a.id
         WHERE a.organization_id = ? AND a.branch_id = ?
           AND a.scheduled_at >= ? AND a.scheduled_at <= ?
           AND a.status = 'completed'
           AND a._deleted = 0
         GROUP BY c.id
         ORDER BY visits DESC
         LIMIT ?`,
        [orgId!, branchId!, `${start}T00:00:00`, `${end}T23:59:59`, limit]
      );
      return rows as TopClient[];
    },
  });
}

export function useStatsSummary(year: number, month: number) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['stats', 'summary', orgId, branchId, year, month],
    enabled: !!orgId && !!branchId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const db = getDb();

      const [clientCount, apptRows, txRow] = await Promise.all([
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM clients WHERE organization_id = ? AND _deleted = 0`,
          [orgId!]
        ),
        db.getAllAsync<{ status: string }>(
          `SELECT status FROM appointments
           WHERE organization_id = ? AND branch_id = ?
             AND scheduled_at >= ? AND scheduled_at <= ?
             AND _deleted = 0`,
          [orgId!, branchId!, `${start}T00:00:00`, `${end}T23:59:59`]
        ),
        db.getFirstAsync<{ income: number; expenses: number }>(
          `SELECT
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
           FROM transactions
           WHERE organization_id = ? AND branch_id = ? AND date >= ? AND date <= ? AND _deleted = 0`,
          [orgId!, branchId!, start, end]
        ),
      ]);

      const total_appointments = apptRows.length;
      const completed_appointments = apptRows.filter((a) => a.status === 'completed').length;
      const no_show_count = apptRows.filter((a) => a.status === 'no_show').length;
      const completion_rate = total_appointments > 0
        ? Math.round((completed_appointments / total_appointments) * 100)
        : 0;

      const month_income = txRow?.income ?? 0;
      const month_expenses = txRow?.expenses ?? 0;

      return {
        total_clients: clientCount?.count ?? 0,
        total_appointments,
        completed_appointments,
        no_show_count,
        month_income,
        month_expenses,
        month_net: month_income - month_expenses,
        completion_rate,
      } as StatsSummary;
    },
  });
}
