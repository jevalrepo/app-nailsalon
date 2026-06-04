import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { randomUUID } from 'expo-crypto';

export interface CreateClientInput {
  name: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  notes?: string;
}

export interface UpdateClientInput extends CreateClientInput {
  id: string;
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { session } = useAuthStore();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const activeOrgId = orgId ?? useAuthStore.getState().activeOrganizationId;
      if (!activeOrgId) throw new Error('No hay organización activa');
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();
      const row = {
        id,
        organization_id: activeOrgId,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        birthdate: input.birthdate || null,
        notes: input.notes?.trim() || null,
        no_show_count: 0,
        created_by: session!.user.id,
        created_at: now,
      };

      await db.runAsync(
        `INSERT INTO clients (id, organization_id, name, phone, email, birthdate, notes, no_show_count, created_by, created_at, _synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
        [id, activeOrgId, row.name, row.phone, row.email, row.birthdate, row.notes, row.created_by, now]
      );

      enqueue({ table: 'clients', operation: 'INSERT', rowId: id, payload: row, organization_id: activeOrgId });

      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', orgId] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateClientInput) => {
      const db = getDb();
      const now = new Date().toISOString();
      const patch = {
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        birthdate: input.birthdate || null,
        notes: input.notes?.trim() || null,
        updated_at: now,
      };

      await db.runAsync(
        `UPDATE clients SET name=?, phone=?, email=?, birthdate=?, notes=?, updated_at=?, _synced=0 WHERE id=?`,
        [patch.name, patch.phone, patch.email, patch.birthdate, patch.notes, now, id]
      );

      enqueue({ table: 'clients', operation: 'UPDATE', rowId: id, payload: { id, ...patch }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['clients', orgId] });
      qc.invalidateQueries({ queryKey: ['client', orgId, vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      await db.runAsync('UPDATE clients SET _deleted=1, _synced=0 WHERE id=?', [id]);
      enqueue({ table: 'clients', operation: 'DELETE', rowId: id, payload: { id }, organization_id: orgId ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', orgId] }),
  });
}
