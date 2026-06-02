import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { Branch } from '@/types';

interface BranchPayload {
  name: string;
  address?: string | null;
  phone?: string | null;
}

export function useCreateBranch() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async (payload: BranchPayload) => {
      const { data, error } = await supabase
        .from('branches')
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;

      // Guardar en SQLite
      try {
        const db = getDb();
        await db.runAsync(
          `INSERT OR REPLACE INTO branches (id, organization_id, name, address, phone, is_active, is_default, created_at, _synced)
           VALUES (?, ?, ?, ?, ?, 1, 0, ?, 1)`,
          [data.id, data.organization_id, data.name, data.address ?? null, data.phone ?? null, data.created_at]
        );
      } catch { /* no crítico */ }

      return data as Branch;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', orgId] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async ({ id, ...payload }: BranchPayload & { id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      try {
        const db = getDb();
        await db.runAsync(
          'UPDATE branches SET name = ?, address = ?, phone = ?, _synced = 1 WHERE id = ?',
          [data.name, data.address ?? null, data.phone ?? null, id]
        );
      } catch { /* no crítico */ }

      return data as Branch;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', orgId] }),
  });
}

export function useToggleBranch() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('branches')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;

      try {
        const db = getDb();
        await db.runAsync('UPDATE branches SET is_active = ?, _synced = 1 WHERE id = ?', [is_active ? 1 : 0, id]);
      } catch { /* no crítico */ }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', orgId] }),
  });
}
