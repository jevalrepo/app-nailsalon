import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { Profile } from '@/types';

export function useEmployees() {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['employees', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<Profile>(
        `SELECT id, full_name, role, phone, avatar_url, created_at
         FROM profiles
         WHERE organization_id = ? AND _deleted = 0
         ORDER BY full_name ASC`,
        [orgId!]
      );
      return rows;
    },
  });
}

export function useEmployeeById(id: string | undefined) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['employees', orgId, id],
    enabled: !!orgId && !!id,
    queryFn: async () => {
      if (!id) return null;
      const db = getDb();
      const row = await db.getFirstAsync<Profile>(
        `SELECT id, full_name, role, phone, avatar_url, created_at
         FROM profiles
         WHERE id = ? AND organization_id = ? AND _deleted = 0`,
        [id, orgId!]
      );
      if (!row) throw new Error('Employee not found');
      return row;
    },
  });
}

export interface EmployeeStats {
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  appointmentsThisMonth: number;
}

export function useEmployeeStats(employeeId: string | undefined) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['employee-stats', orgId, employeeId],
    enabled: !!orgId && !!employeeId,
    queryFn: async (): Promise<EmployeeStats> => {
      if (!employeeId) {
        return { totalAppointments: 0, completedAppointments: 0, totalRevenue: 0, appointmentsThisMonth: 0 };
      }

      const db = getDb();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [totalRow, completedRow, revenueRow, monthRow] = await Promise.all([
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM appointments
           WHERE organization_id = ? AND employee_id = ? AND status != 'cancelled' AND _deleted = 0`,
          [orgId!, employeeId]
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM appointments
           WHERE organization_id = ? AND employee_id = ? AND status = 'completed' AND _deleted = 0`,
          [orgId!, employeeId]
        ),
        db.getFirstAsync<{ total: number }>(
          `SELECT COALESCE(SUM(as_.price_snapshot), 0) as total
           FROM appointment_services as_
           JOIN appointments a ON a.id = as_.appointment_id
           WHERE a.organization_id = ? AND a.employee_id = ? AND a.status = 'completed' AND a._deleted = 0`,
          [orgId!, employeeId]
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM appointments
           WHERE organization_id = ? AND employee_id = ?
             AND scheduled_at >= ? AND scheduled_at <= ?
             AND status != 'cancelled' AND _deleted = 0`,
          [orgId!, employeeId, startOfMonth, endOfMonth]
        ),
      ]);

      return {
        totalAppointments: totalRow?.count ?? 0,
        completedAppointments: completedRow?.count ?? 0,
        totalRevenue: revenueRow?.total ?? 0,
        appointmentsThisMonth: monthRow?.count ?? 0,
      };
    },
  });
}
