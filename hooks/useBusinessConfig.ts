import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { SQLiteBindParams } from 'expo-sqlite';

export interface BusinessConfig {
  id: string;
  organization_id: string;
  business_name: string;
  phone: string;
  address: string;
  instagram_handle: string;
  open_time: string;
  close_time: string;
  work_days: number[];
  currency: string;
  off_hours_surcharge: number;
  off_hours_surcharge_type: 'fixed' | 'percent';
  updated_at: string;
}

export function useBusinessConfig() {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['business_config', orgId],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM business_config WHERE organization_id = ? LIMIT 1',
        [orgId!]
      );
      if (!row) return null;
      return {
        ...row,
        work_days: typeof row.work_days === 'string'
          ? JSON.parse(row.work_days as string)
          : (row.work_days ?? [1, 2, 3, 4, 5, 6]),
      } as BusinessConfig;
    },
  });
}

export function useUpdateBusinessConfig() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<BusinessConfig, 'id' | 'organization_id' | 'updated_at'>>) => {
      if (!orgId) throw new Error('No hay organización activa');
      const db = getDb();
      const now = new Date().toISOString();

      const payload: Record<string, unknown> = { ...updates, updated_at: now };
      if (Array.isArray(payload.work_days)) {
        payload.work_days = JSON.stringify(payload.work_days);
      }

      const setClauses = Object.keys(payload).map((k) => `${k} = ?`).join(', ');
      const values = [...Object.values(payload), orgId];

      await db.runAsync(
        `UPDATE business_config SET ${setClauses}, _synced = 0 WHERE organization_id = ?`,
        values as SQLiteBindParams
      );

      // Obtener el id actual para el payload de sync
      const current = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM business_config WHERE organization_id = ? LIMIT 1',
        [orgId]
      );

      enqueue({
        table: 'business_config',
        operation: 'UPDATE',
        rowId: current?.id ?? orgId,
        payload: { organization_id: orgId, ...updates, updated_at: now },
        organization_id: orgId,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_config', orgId] }),
  });
}

export function isWithinWorkHours(slot: string, openTime: string, closeTime: string): boolean {
  return slot >= openTime && slot < closeTime;
}

export function isWorkDay(dayOfWeek: number, workDays: number[]): boolean {
  return workDays.includes(dayOfWeek);
}

export function isWorkDate(dateStr: string, workDays: number[]): boolean {
  const dow = new Date(`${dateStr}T12:00:00`).getDay();
  return isWorkDay(dow, workDays);
}
