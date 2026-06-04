import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Branch } from '@/types';

export function useBranches() {
  const { orgId } = useActiveOrg();
  const setBranches = useAuthStore((s) => s.setBranches);

  const query = useQuery<Branch[]>({
    queryKey: ['branches', orgId],
    enabled: !!orgId,
    staleTime: 0,
    queryFn: async () => {
      // SQLite primero
      try {
        const db = getDb();
        const rows = await db.getAllAsync<Record<string, unknown>>(
          'SELECT * FROM branches WHERE organization_id = ? AND _deleted = 0 ORDER BY is_default DESC, name ASC',
          [orgId!]
        );
        if (rows.length > 0) return rows as unknown as Branch[];
      } catch { /* SQLite no disponible */ }

      // Supabase
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', orgId!)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return (data ?? []) as Branch[];
    },
  });

  // Sincronizar branches al store cuando cargan
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      setBranches(query.data);
    }
  }, [query.data]);

  return query;
}
