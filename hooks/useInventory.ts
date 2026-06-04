import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import type { InventoryItem } from '@/types';

async function resolveBranch(db: ReturnType<typeof getDb>, orgId: string, branchId: string | null): Promise<string | null> {
  if (branchId) return branchId;
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM branches WHERE organization_id = ? AND _deleted = 0 AND is_active = 1 ORDER BY is_default DESC LIMIT 1',
    [orgId]
  );
  return row?.id ?? null;
}

export function useInventory() {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();

  return useQuery({
    queryKey: ['inventory', orgId, branchId],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const resolvedBranchId = await resolveBranch(db, orgId!, branchId);
      if (!resolvedBranchId) return [];
      const rows = await db.getAllAsync<InventoryItem>(
        `SELECT id, name, quantity, unit, min_stock, created_at
         FROM inventory
         WHERE organization_id = ? AND branch_id = ? AND _deleted = 0
         ORDER BY name ASC`,
        [orgId!, resolvedBranchId]
      );
      return rows;
    },
  });
}

export function useInventoryItem(id: string) {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();

  return useQuery({
    queryKey: ['inventory', orgId, branchId, id],
    enabled: !!orgId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const resolvedBranchId = await resolveBranch(db, orgId!, branchId);
      if (!resolvedBranchId) throw new Error('No hay sucursal activa');
      const row = await db.getFirstAsync<InventoryItem>(
        `SELECT id, name, quantity, unit, min_stock, created_at
         FROM inventory
         WHERE id = ? AND organization_id = ? AND branch_id = ? AND _deleted = 0`,
        [id, orgId!, resolvedBranchId]
      );
      if (!row) throw new Error('Inventory item not found');
      return row;
    },
  });
}

export function isLowStock(item: InventoryItem): boolean {
  return item.min_stock > 0 && item.quantity <= item.min_stock;
}
