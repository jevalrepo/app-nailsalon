import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { randomUUID } from 'expo-crypto';

export interface TransactionInput {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  payment_method: 'cash' | 'card' | 'transfer';
  date: string;
  appointment_id?: string | null;
  employee_id?: string | null;
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const { session } = useAuthStore();
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      if (!session) throw new Error('No autenticado');
      if (!orgId) throw new Error('No hay organización activa');
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();
      const row = {
        id,
        organization_id: orgId,
        branch_id: branchId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        category: input.category,
        payment_method: input.payment_method,
        date: input.date,
        appointment_id: input.appointment_id ?? null,
        employee_id: input.employee_id ?? null,
        created_by: session.user.id,
        created_at: now,
      };

      await db.runAsync(
        `INSERT INTO transactions (id, organization_id, branch_id, type, amount, description, category, payment_method, date, appointment_id, employee_id, created_by, created_at, _synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, orgId, branchId ?? null, row.type, row.amount, row.description, row.category, row.payment_method,
          row.date, row.appointment_id, row.employee_id, row.created_by, now]
      );

      enqueue({ table: 'transactions', operation: 'INSERT', rowId: id, payload: row, organization_id: orgId });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput & { id: string }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE transactions SET type=?, amount=?, description=?, category=?, payment_method=?, date=?,
         appointment_id=?, employee_id=?, updated_at=?, _synced=0 WHERE id=?`,
        [input.type, input.amount, input.description, input.category, input.payment_method,
          input.date, input.appointment_id ?? null, input.employee_id ?? null, now, id]
      );

      enqueue({ table: 'transactions', operation: 'UPDATE', rowId: id, payload: { id, ...input, updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      await db.runAsync('UPDATE transactions SET _deleted=1, _synced=0 WHERE id=?', [id]);
      enqueue({ table: 'transactions', operation: 'DELETE', rowId: id, payload: { id }, organization_id: orgId ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
