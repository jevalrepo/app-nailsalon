import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import type { InventoryItem } from '@/types';

export function useInventory() {
  const { orgId } = useActiveOrg();
  const { branchId } = useActiveBranch();

  return useQuery({
    queryKey: ['inventory', orgId, branchId],
    enabled: !!orgId && !!branchId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<InventoryItem>(
        `SELECT id, name, quantity, unit, min_stock, created_at
         FROM inventory
         WHERE organization_id = ? AND branch_id = ? AND _deleted = 0
         ORDER BY name ASC`,
        [orgId!, branchId!]
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
    enabled: !!orgId && !!branchId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<InventoryItem>(
        `SELECT id, name, quantity, unit, min_stock, created_at
         FROM inventory
         WHERE id = ? AND organization_id = ? AND branch_id = ? AND _deleted = 0`,
        [id, orgId!, branchId!]
      );
      if (!row) throw new Error('Inventory item not found');
      return row;
    },
  });
}

export function isLowStock(item: InventoryItem): boolean {
  return item.min_stock > 0 && item.quantity <= item.min_stock;
}
