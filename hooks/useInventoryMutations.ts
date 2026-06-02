import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { randomUUID } from 'expo-crypto';

interface InventoryPayload {
  name: string;
  quantity: number;
  unit: string;
  min_stock: number;
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (payload: InventoryPayload) => {
      if (!orgId) throw new Error('No hay organización activa');
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO inventory (id, organization_id, branch_id, name, quantity, unit, min_stock, created_at, _synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, orgId, branchId ?? null, payload.name, payload.quantity, payload.unit, payload.min_stock, now]
      );

      enqueue({ table: 'inventory', operation: 'INSERT', rowId: id, payload: { id, organization_id: orgId, branch_id: branchId, ...payload, created_at: now }, organization_id: orgId });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', orgId] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, ...payload }: InventoryPayload & { id: string }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE inventory SET name=?, quantity=?, unit=?, min_stock=?, updated_at=?, _synced=0 WHERE id=?`,
        [payload.name, payload.quantity, payload.unit, payload.min_stock, now, id]
      );

      enqueue({ table: 'inventory', operation: 'UPDATE', rowId: id, payload: { id, ...payload, updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['inventory', orgId] });
      qc.invalidateQueries({ queryKey: ['inventory', orgId, vars.id] });
    },
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      await db.runAsync('UPDATE inventory SET _deleted=1, _synced=0 WHERE id=?', [id]);
      enqueue({ table: 'inventory', operation: 'DELETE', rowId: id, payload: { id }, organization_id: orgId ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', orgId] }),
  });
}
