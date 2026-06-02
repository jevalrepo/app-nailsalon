import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { Task } from '@/types';

export interface TaskWithProfile extends Task {
  assigned_to_name: string | null;
  created_by_name: string | null;
}

export function useTasks(filter: 'all' | 'pending' | 'completed' | 'mine' = 'all') {
  const { session } = useAuthStore();
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['tasks', orgId, filter],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT
           t.id, t.title, t.is_completed, t.due_date, t.assigned_to, t.created_by, t.created_at,
           p1.full_name AS assigned_to_name,
           p2.full_name AS created_by_name
         FROM tasks t
         LEFT JOIN profiles p1 ON p1.id = t.assigned_to
         LEFT JOIN profiles p2 ON p2.id = t.created_by
         WHERE t.organization_id = ? AND t._deleted = 0
         ORDER BY t.is_completed ASC, t.due_date ASC NULLS LAST, t.created_at DESC`,
        [orgId!]
      );

      let result: TaskWithProfile[] = rows.map((r) => ({
        id: r.id as string,
        title: r.title as string,
        is_completed: r.is_completed === 1 || r.is_completed === true,
        due_date: r.due_date as string | null,
        assigned_to: r.assigned_to as string | null,
        created_by: r.created_by as string,
        created_at: r.created_at as string,
        assigned_to_name: r.assigned_to_name as string | null,
        created_by_name: r.created_by_name as string | null,
      }));

      if (filter === 'pending')   result = result.filter((t) => !t.is_completed);
      if (filter === 'completed') result = result.filter((t) => t.is_completed);
      if (filter === 'mine')      result = result.filter((t) => t.assigned_to === session!.user.id);

      return result;
    },
  });
}

export function useTaskById(id: string) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['tasks', orgId, id],
    enabled: !!orgId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const r = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT
           t.id, t.title, t.is_completed, t.due_date, t.assigned_to, t.created_by, t.created_at,
           p1.full_name AS assigned_to_name,
           p2.full_name AS created_by_name
         FROM tasks t
         LEFT JOIN profiles p1 ON p1.id = t.assigned_to
         LEFT JOIN profiles p2 ON p2.id = t.created_by
         WHERE t.id = ? AND t.organization_id = ? AND t._deleted = 0`,
        [id, orgId!]
      );
      if (!r) throw new Error('Task not found');
      return {
        id: r.id as string,
        title: r.title as string,
        is_completed: r.is_completed === 1 || r.is_completed === true,
        due_date: r.due_date as string | null,
        assigned_to: r.assigned_to as string | null,
        created_by: r.created_by as string,
        created_at: r.created_at as string,
        assigned_to_name: r.assigned_to_name as string | null,
        created_by_name: r.created_by_name as string | null,
      } as TaskWithProfile;
    },
  });
}

export function isOverdue(task: Task): boolean {
  if (task.is_completed || !task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}
