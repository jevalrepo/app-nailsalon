import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/database';
import { useSyncQueue, QueueEntry } from '@/stores/useSyncQueue';
import type { SQLiteBindParams } from 'expo-sqlite';

// Tablas que tienen columna organization_id (excluye appointment_services)
const ORG_SCOPED_TABLES = new Set([
  'profiles',
  'clients',
  'services',
  'appointments',
  'transactions',
  'inventory',
  'designs',
  'tasks',
  'agenda_blocks',
  'business_config',
]);

const MAX_RETRIES = 3;

// Tablas que se sincronizan desde Supabase al pull
const SYNC_TABLES = [
  'profiles',
  'clients',
  'services',
  'appointments',
  'appointment_services',
  'transactions',
  'inventory',
  'designs',
  'tasks',
  'agenda_blocks',
  'business_config',
] as const;

type SyncTable = (typeof SYNC_TABLES)[number];

// Columnas que existen solo en SQLite local y deben excluirse al subir a Supabase
const LOCAL_ONLY_COLUMNS = ['_synced', '_deleted'];

// Columnas seleccionadas por tabla para el pull (excluyendo las locales)
const TABLE_SELECT: Record<SyncTable, string> = {
  profiles: 'id,full_name,role,phone,avatar_url,is_active,created_at',
  clients: 'id,name,phone,email,birthdate,notes,no_show_count,created_by,created_at',
  services: 'id,name,description,price,duration_min,category,is_active,applies_surcharge,created_at',
  appointments: 'id,client_id,employee_id,scheduled_at,status,payment_status,notes,recurrence_type,recurrence_end_date,parent_appointment_id,created_at',
  appointment_services: 'id,appointment_id,service_id,price_snapshot',
  transactions: 'id,type,amount,description,category,payment_method,appointment_id,employee_id,date,created_by,created_at',
  inventory: 'id,name,quantity,unit,min_stock,created_at',
  designs: 'id,title,image_url,tags,uploaded_by,created_at',
  tasks: 'id,title,is_completed,due_date,assigned_to,created_by,created_at',
  agenda_blocks: 'id,employee_id,starts_at,ends_at,reason,created_at',
  business_config: 'id,business_name,phone,address,instagram_handle,open_time,close_time,work_days,currency,off_hours_surcharge,off_hours_surcharge_type,updated_at',
};

function stripLocalColumns(payload: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!LOCAL_ONLY_COLUMNS.includes(k)) {
      clean[k] = v;
    }
  }
  return clean;
}

async function uploadEntry(entry: QueueEntry): Promise<void> {
  const data = stripLocalColumns(entry.payload);

  if (entry.operation === 'INSERT') {
    const { error } = await supabase.from(entry.table).upsert(data, { onConflict: 'id' });
    if (error) throw error;
  } else if (entry.operation === 'UPDATE') {
    const { error } = await supabase.from(entry.table).update(data).eq('id', entry.rowId);
    if (error) throw error;
  } else if (entry.operation === 'DELETE') {
    const { error } = await supabase.from(entry.table).delete().eq('id', entry.rowId);
    if (error) throw error;
  }
}

export async function processSyncQueue(): Promise<void> {
  const { queue, dequeue, markRetry, setIsSyncing, setLastSyncAt } =
    useSyncQueue.getState();

  if (queue.length === 0) return;

  setIsSyncing(true);
  const db = getDb();

  // Ordenar: entradas sin dependencia primero, luego las dependientes
  const sorted = [...queue].sort((a, b) => {
    if (a.dependsOn && a.dependsOn === b.id) return 1;
    if (b.dependsOn && b.dependsOn === a.id) return -1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // rowIds de todas las entradas en cola — para detectar dependencias huérfanas
  const allRowIds = new Set(sorted.map((e) => e.rowId));

  // processedRowIds guarda los rowIds ya subidos exitosamente
  const processedRowIds = new Set<string>();

  for (const entry of sorted) {
    if (entry.retries >= MAX_RETRIES) continue;

    // Si depende de un rowId que ya no existe en la cola (entrada huérfana
    // por bug anterior), tratar como independiente y subir de todas formas
    const dependencyExists = entry.dependsOn && allRowIds.has(entry.dependsOn);
    if (dependencyExists && !processedRowIds.has(entry.dependsOn!)) continue;

    try {
      await uploadEntry(entry);

      // Marcar como sincronizado en SQLite local
      if (entry.operation !== 'DELETE') {
        await db.runAsync(
          `UPDATE ${entry.table} SET _synced = 1 WHERE id = ?`,
          [entry.rowId]
        );
      }

      dequeue(entry.id);
      processedRowIds.add(entry.rowId);
    } catch {
      markRetry(entry.id);
    }
  }

  setIsSyncing(false);
  setLastSyncAt(new Date().toISOString());
}

async function upsertLocalRows(
  db: ReturnType<typeof getDb>,
  table: SyncTable,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;

  for (const row of rows) {
    // Manejar arrays (tags, work_days) serializándolos a JSON
    const processed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      processed[k] = Array.isArray(v) ? JSON.stringify(v) : v;
    }

    const cols = Object.keys(processed);
    const placeholders = cols.map(() => '?').join(', ');
    const colList = cols.join(', ');
    const values = Object.values(processed);

    await db.runAsync(
      `INSERT OR REPLACE INTO ${table} (${colList}, _synced) VALUES (${placeholders}, 1)`,
      values as SQLiteBindParams
    );
  }
}

export async function pullFromSupabase(orgId?: string): Promise<void> {
  const db = getDb();

  for (const table of SYNC_TABLES) {
    try {
      // Obtener el updated_at más reciente en local para sync incremental
      // Si hay orgId activo, solo comparar registros de esa org
      const lastRow = orgId && ORG_SCOPED_TABLES.has(table)
        ? await db.getFirstAsync<{ updated_at: string } | null>(
            `SELECT updated_at FROM ${table} WHERE organization_id = ? AND updated_at IS NOT NULL ORDER BY updated_at DESC LIMIT 1`,
            [orgId]
          )
        : await db.getFirstAsync<{ updated_at: string } | null>(
            `SELECT updated_at FROM ${table} WHERE updated_at IS NOT NULL ORDER BY updated_at DESC LIMIT 1`
          );

      let query = supabase.from(table).select(TABLE_SELECT[table]);

      // Filtrar por organización activa en las tablas que lo soporten
      if (orgId && ORG_SCOPED_TABLES.has(table)) {
        query = query.eq('organization_id', orgId);
      }

      if (lastRow?.updated_at && table !== 'appointment_services') {
        query = query.gt('updated_at', lastRow.updated_at);
      }

      const { data, error } = await query;
      if (error || !data) continue;

      await upsertLocalRows(db, table, data as unknown as Record<string, unknown>[]);
    } catch {
      // Continuar con la siguiente tabla si falla una
    }
  }
}

/**
 * Limpia todos los datos de la org anterior del caché SQLite local.
 * Se llama al cambiar de organización activa para evitar mostrar
 * datos de otra org antes de que el pull termine.
 */
export async function clearOrgCache(orgId: string): Promise<void> {
  const db = getDb();
  for (const table of ORG_SCOPED_TABLES) {
    try {
      await db.runAsync(
        `DELETE FROM ${table} WHERE organization_id != ? OR organization_id IS NULL`,
        [orgId]
      );
    } catch {
      // Si la tabla no existe o no tiene la columna, continuar
    }
  }
  // appointment_services no tiene org_id pero depende de appointments —
  // se limpia en cascada por FK si foreign_keys = ON
}
