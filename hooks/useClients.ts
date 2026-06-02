import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { Client } from '@/types';

export function useClients(search: string = '') {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['clients', orgId, search],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      if (search.trim()) {
        const rows = await db.getAllAsync<Client>(
          `SELECT id, name, phone, email, no_show_count, created_at
           FROM clients
           WHERE organization_id = ? AND name LIKE ? AND _deleted = 0
           ORDER BY name ASC`,
          [orgId!, `%${search.trim()}%`]
        );
        return rows;
      }
      const rows = await db.getAllAsync<Client>(
        `SELECT id, name, phone, email, no_show_count, created_at
         FROM clients
         WHERE organization_id = ? AND _deleted = 0
         ORDER BY name ASC`,
        [orgId!]
      );
      return rows;
    },
  });
}

export function useClientById(id: string) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['client', orgId, id],
    enabled: !!orgId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<Client>(
        `SELECT id, name, phone, email, birthdate, notes, no_show_count, created_at
         FROM clients
         WHERE id = ? AND organization_id = ? AND _deleted = 0`,
        [id, orgId!]
      );
      if (!row) throw new Error('Client not found');
      return row;
    },
  });
}
