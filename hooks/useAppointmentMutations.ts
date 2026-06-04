import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { randomUUID } from 'expo-crypto';
import type { SQLiteBindParams } from 'expo-sqlite';
import type { AppointmentStatus } from '@/types';

export interface CreateAppointmentInput {
  client_id: string;
  employee_id: string;
  scheduled_at: string;
  notes?: string;
  service_ids: string[];
  price_snapshots: Record<string, number>;
}

export interface UpdateAppointmentInput {
  id: string;
  client_id?: string;
  employee_id?: string;
  scheduled_at?: string;
  notes?: string;
  status?: AppointmentStatus;
  payment_status?: 'pending' | 'paid';
  service_ids?: string[];
  price_snapshots?: Record<string, number>;
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const activeOrgId = orgId ?? useAuthStore.getState().activeOrganizationId;
      if (!activeOrgId) throw new Error('No hay organización activa');

      // Resolver branchId: usar el del store o buscar el default en SQLite
      let activeBranchId = branchId ?? useAuthStore.getState().activeBranchId;
      if (!activeBranchId) {
        const db2 = getDb();
        const defaultBranch = await db2.getFirstAsync<{ id: string }>(
          'SELECT id FROM branches WHERE organization_id = ? AND _deleted = 0 AND is_active = 1 ORDER BY is_default DESC LIMIT 1',
          [activeOrgId]
        );
        activeBranchId = defaultBranch?.id ?? null;
      }

      const db = getDb();
      const apptId = randomUUID();
      const now = new Date().toISOString();

      const apptRow = {
        id: apptId,
        organization_id: activeOrgId,
        branch_id: activeBranchId,
        client_id: input.client_id,
        employee_id: input.employee_id,
        scheduled_at: input.scheduled_at,
        notes: input.notes ?? null,
        status: 'pending',
        payment_status: 'pending',
        recurrence_type: 'none',
        created_at: now,
      };

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO appointments (id, organization_id, branch_id, client_id, employee_id, scheduled_at, notes, status, payment_status, recurrence_type, created_at, _synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'none', ?, 0)`,
          [apptId, activeOrgId, activeBranchId ?? null, input.client_id, input.employee_id, input.scheduled_at, input.notes ?? null, now]
        );

        for (const sid of input.service_ids) {
          const svcId = randomUUID();
          await db.runAsync(
            `INSERT INTO appointment_services (id, appointment_id, service_id, price_snapshot, _synced)
             VALUES (?, ?, ?, ?, 0)`,
            [svcId, apptId, sid, input.price_snapshots[sid] ?? 0]
          );
        }
      });

      enqueue({ table: 'appointments', operation: 'INSERT', rowId: apptId, payload: apptRow, organization_id: activeOrgId });

      const svcRows = await db.getAllAsync<{ id: string; service_id: string; price_snapshot: number }>(
        'SELECT id, service_id, price_snapshot FROM appointment_services WHERE appointment_id=?',
        [apptId]
      );
      for (const svc of svcRows) {
        enqueue({
          table: 'appointment_services',
          operation: 'INSERT',
          rowId: svc.id,
          payload: { id: svc.id, appointment_id: apptId, service_id: svc.service_id, price_snapshot: svc.price_snapshot },
          organization_id: orgId,
          dependsOn: apptId,
        });
      }

      return apptId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (input: UpdateAppointmentInput) => {
      const db = getDb();
      const { id, service_ids, price_snapshots, ...fields } = input;
      const now = new Date().toISOString();

      const updateFields: Record<string, unknown> = { ...fields, updated_at: now, _synced: 0 };
      const setClauses = Object.keys(updateFields).map((k) => `${k}=?`).join(', ');

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE appointments SET ${setClauses} WHERE id=?`,
          [...Object.values(updateFields), id] as SQLiteBindParams
        );

        if (service_ids !== undefined && price_snapshots !== undefined) {
          await db.runAsync('DELETE FROM appointment_services WHERE appointment_id=?', [id]);
          for (const sid of service_ids) {
            const svcId = randomUUID();
            await db.runAsync(
              `INSERT INTO appointment_services (id, appointment_id, service_id, price_snapshot, _synced)
               VALUES (?, ?, ?, ?, 0)`,
              [svcId, id, sid, price_snapshots[sid] ?? 0]
            );
          }
        }
      });

      const supabaseFields: Record<string, unknown> = { ...fields, updated_at: now };
      delete supabaseFields._synced;
      enqueue({ table: 'appointments', operation: 'UPDATE', rowId: id, payload: { id, ...supabaseFields }, organization_id: orgId ?? null });

      if (service_ids !== undefined && price_snapshots !== undefined) {
        enqueue({ table: 'appointment_services', operation: 'DELETE', rowId: id, payload: { appointment_id: id }, organization_id: orgId ?? null });
        const svcRows = await db.getAllAsync<{ id: string; service_id: string; price_snapshot: number }>(
          'SELECT id, service_id, price_snapshot FROM appointment_services WHERE appointment_id=?',
          [id]
        );
        for (const svc of svcRows) {
          enqueue({
            table: 'appointment_services',
            operation: 'INSERT',
            rowId: svc.id,
            payload: { id: svc.id, appointment_id: id, service_id: svc.service_id, price_snapshot: svc.price_snapshot },
            organization_id: orgId ?? null,
            dependsOn: id,
          });
        }
      }
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', orgId, input.id] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE appointments SET status='cancelled', updated_at=?, _synced=0 WHERE id=?`,
        [now, id]
      );
      enqueue({ table: 'appointments', operation: 'UPDATE', rowId: id, payload: { id, status: 'cancelled', updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', orgId, id] });
    },
  });
}

export function useMarkNoShow() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE appointments SET status='no_show', updated_at=?, _synced=0 WHERE id=?`,
        [now, id]
      );
      enqueue({ table: 'appointments', operation: 'UPDATE', rowId: id, payload: { id, status: 'no_show', updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', orgId, id] });
    },
  });
}

export function useCompleteAppointment() {
  const qc = useQueryClient();
  const { session } = useAuthStore();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, paymentStatus, paymentMethod = 'cash' }: {
      id: string;
      paymentStatus: 'pending' | 'paid';
      paymentMethod?: 'cash' | 'card' | 'transfer';
    }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE appointments SET status='completed', payment_status=?, updated_at=?, _synced=0 WHERE id=?`,
        [paymentStatus, now, id]
      );
      enqueue({ table: 'appointments', operation: 'UPDATE', rowId: id, payload: { id, status: 'completed', payment_status: paymentStatus, updated_at: now }, organization_id: orgId ?? null });

      if (paymentStatus === 'paid' && session) {
        const existing = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM transactions WHERE appointment_id=? AND _deleted=0',
          [id]
        );

        if (!existing) {
          const appt = await db.getFirstAsync<{
            scheduled_at: string;
            employee_id: string;
            client_name: string;
            total: number;
          }>(
            `SELECT a.scheduled_at, a.employee_id,
                    COALESCE(c.name, 'Clienta') AS client_name,
                    COALESCE(SUM(as_.price_snapshot), 0) AS total
             FROM appointments a
             LEFT JOIN clients c ON c.id = a.client_id
             LEFT JOIN appointment_services as_ ON as_.appointment_id = a.id
             WHERE a.id = ?
             GROUP BY a.id`,
            [id]
          );

          if (appt) {
            const txId = randomUUID();
            const txDate = appt.scheduled_at.split('T')[0];
            const txRow = {
              id: txId,
              organization_id: orgId,
              type: 'income' as const,
              amount: appt.total,
              description: `Servicio — ${appt.client_name}`,
              category: 'Servicio',
              payment_method: paymentMethod,
              date: txDate,
              appointment_id: id,
              employee_id: appt.employee_id ?? null,
              created_by: session.user.id,
              created_at: now,
            };

            await db.runAsync(
              `INSERT INTO transactions (id, organization_id, type, amount, description, category, payment_method, date, appointment_id, employee_id, created_by, created_at, _synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
              [txId, orgId ?? null, txRow.type, txRow.amount, txRow.description, txRow.category,
                txRow.payment_method, txRow.date, txRow.appointment_id,
                txRow.employee_id, txRow.created_by, now]
            );

            enqueue({ table: 'transactions', operation: 'INSERT', rowId: txId, payload: txRow, organization_id: orgId ?? null });
          }
        }
      }
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', orgId, id] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const activeOrgId = orgId ?? useAuthStore.getState().activeOrganizationId;
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE appointment_services SET _deleted=1, _synced=0 WHERE appointment_id=?`,
        [id]
      );
      await db.runAsync(
        `UPDATE appointments SET _deleted=1, _synced=0, updated_at=? WHERE id=?`,
        [now, id]
      );

      enqueue({ table: 'appointment_services', operation: 'DELETE', rowId: id, payload: { appointment_id: id }, organization_id: activeOrgId ?? null });
      enqueue({ table: 'appointments', operation: 'DELETE', rowId: id, payload: { id }, organization_id: activeOrgId ?? null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
