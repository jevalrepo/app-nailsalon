import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { randomUUID } from 'expo-crypto';
import type { ServiceCategory } from '@/types';

interface ServicePayload {
  name: string;
  description?: string;
  price: number;
  duration_min: number;
  category: ServiceCategory;
  applies_surcharge?: boolean;
}

export function useCreateService() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (payload: ServicePayload) => {
      if (!orgId) throw new Error('No hay organización activa');
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();
      const row = { id, organization_id: orgId, ...payload, is_active: true, created_at: now };

      await db.runAsync(
        `INSERT INTO services (id, organization_id, name, description, price, duration_min, category, is_active, applies_surcharge, created_at, _synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0)`,
        [id, orgId, payload.name, payload.description ?? null, payload.price, payload.duration_min,
          payload.category, payload.applies_surcharge ? 1 : 0, now]
      );

      enqueue({ table: 'services', operation: 'INSERT', rowId: id, payload: row, organization_id: orgId });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', orgId] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, ...payload }: ServicePayload & { id: string }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE services SET name=?, description=?, price=?, duration_min=?, category=?, applies_surcharge=?, updated_at=?, _synced=0 WHERE id=?`,
        [payload.name, payload.description ?? null, payload.price, payload.duration_min,
          payload.category, payload.applies_surcharge ? 1 : 0, now, id]
      );

      enqueue({ table: 'services', operation: 'UPDATE', rowId: id, payload: { id, ...payload, updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['services', orgId] });
      qc.invalidateQueries({ queryKey: ['service', orgId, vars.id] });
    },
  });
}

export function useToggleServiceActive() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE services SET is_active=?, updated_at=?, _synced=0 WHERE id=?`,
        [is_active ? 1 : 0, now, id]
      );

      enqueue({ table: 'services', operation: 'UPDATE', rowId: id, payload: { id, is_active, updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['services', orgId] });
      qc.invalidateQueries({ queryKey: ['service', orgId, vars.id] });
    },
  });
}
