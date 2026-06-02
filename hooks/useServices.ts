import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { Service } from '@/types';

function mapRow(row: Record<string, unknown>): Service {
  return {
    ...row,
    is_active: row.is_active === 1 || row.is_active === true,
    applies_surcharge: row.applies_surcharge === 1 || row.applies_surcharge === true,
  } as unknown as Service;
}

/** Para seleccionar servicios en citas: solo activos */
export function useServices() {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['services', 'active', orgId],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT id, name, description, price, duration_min, category, is_active, applies_surcharge, created_at
         FROM services
         WHERE organization_id = ? AND is_active = 1 AND _deleted = 0
         ORDER BY category ASC, name ASC`,
        [orgId!]
      );
      return rows.map(mapRow) as Service[];
    },
  });
}

/** Para el panel de servicios: todos incluyendo inactivos */
export function useAllServices() {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['services', orgId],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT id, name, description, price, duration_min, category, is_active, applies_surcharge, created_at
         FROM services
         WHERE organization_id = ? AND _deleted = 0
         ORDER BY category ASC, name ASC`,
        [orgId!]
      );
      return rows.map(mapRow) as Service[];
    },
  });
}

/** Servicio individual por id */
export function useServiceById(id: string) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['service', orgId, id],
    enabled: !!orgId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT id, name, description, price, duration_min, category, is_active, applies_surcharge, created_at
         FROM services
         WHERE id = ? AND organization_id = ? AND _deleted = 0`,
        [id, orgId!]
      );
      if (!row) throw new Error('Service not found');
      return mapRow(row) as Service;
    },
  });
}
