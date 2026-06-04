import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { randomUUID } from 'expo-crypto';
import type { SQLiteBindParams } from 'expo-sqlite';

export interface CreateTaskInput {
  title: string;
  due_date?: string | null;
  assigned_to?: string | null;
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { session } = useAuthStore();
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!orgId) throw new Error('No hay organización activa');
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();
      const row = {
        id,
        organization_id: orgId,
        branch_id: branchId,
        title: input.title.trim(),
        is_completed: false,
        due_date: input.due_date ?? null,
        assigned_to: input.assigned_to ?? null,
        created_by: session!.user.id,
        created_at: now,
      };

      await db.runAsync(
        `INSERT INTO tasks (id, organization_id, branch_id, title, is_completed, due_date, assigned_to, created_by, created_at, _synced)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 0)`,
        [id, orgId, branchId ?? null, row.title, row.due_date, row.assigned_to, row.created_by, now]
      );

      enqueue({ table: 'tasks', operation: 'INSERT', rowId: id, payload: row, organization_id: orgId });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, title, due_date, assigned_to }: { id: string } & Partial<CreateTaskInput>) => {
      const db = getDb();
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { updated_at: now, _synced: 0 };
      if (title !== undefined)       patch.title = title.trim();
      if (due_date !== undefined)    patch.due_date = due_date;
      if (assigned_to !== undefined) patch.assigned_to = assigned_to;

      const setClauses = Object.keys(patch).map((k) => `${k}=?`).join(', ');
      await db.runAsync(`UPDATE tasks SET ${setClauses} WHERE id=? AND organization_id=?`, [...Object.values(patch), id, orgId] as SQLiteBindParams);

      const supabasePatch: Record<string, unknown> = { updated_at: now };
      if (title !== undefined)       supabasePatch.title = title.trim();
      if (due_date !== undefined)    supabasePatch.due_date = due_date;
      if (assigned_to !== undefined) supabasePatch.assigned_to = assigned_to;

      enqueue({ table: 'tasks', operation: 'UPDATE', rowId: id, payload: { id, ...supabasePatch }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', orgId] });
      qc.invalidateQueries({ queryKey: ['tasks', orgId, vars.id] });
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE tasks SET is_completed=?, updated_at=?, _synced=0 WHERE id=? AND organization_id=?`,
        [completed ? 1 : 0, now, id, orgId]
      );

      enqueue({ table: 'tasks', operation: 'UPDATE', rowId: id, payload: { id, is_completed: completed, updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      await db.runAsync('UPDATE tasks SET _deleted=1, _synced=0 WHERE id=? AND organization_id=?', [id, orgId]);
      enqueue({ table: 'tasks', operation: 'DELETE', rowId: id, payload: { id }, organization_id: orgId ?? null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId] }),
  });
}
