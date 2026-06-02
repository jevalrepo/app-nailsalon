import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/database';
import { useSyncContext } from '@/lib/sync/SyncProvider';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { extractStoragePath } from '@/lib/storage/paths';
import type { Design } from '@/types';

export interface DesignWithUrl extends Design {
  signedUrl: string | null;
}

interface DesignRow {
  id: string;
  title: string;
  image_url: string;
  tags: string;
  uploaded_by: string;
  created_at: string;
}

interface CacheRow {
  design_id: string;
  signed_url: string | null;
  expires_at: string | null;
  local_file_path: string | null;
}

function parseRow(row: DesignRow, cache: CacheRow | null): DesignWithUrl {
  const now = new Date().toISOString();
  const signedUrl = cache?.expires_at && cache.expires_at > now
    ? cache.signed_url
    : null;

  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags ?? []),
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
    signedUrl,
  };
}

async function refreshSignedUrls(db: ReturnType<typeof getDb>, rows: DesignRow[]): Promise<void> {
  const now = new Date().toISOString();

  const staleRows: DesignRow[] = [];
  for (const row of rows) {
    const cache = await db.getFirstAsync<CacheRow>(
      'SELECT * FROM design_cache WHERE design_id=?',
      [row.id]
    );
    if (!cache || !cache.expires_at || cache.expires_at <= now) {
      staleRows.push(row);
    }
  }

  if (staleRows.length === 0) return;

  const paths = staleRows.map((r) => extractStoragePath(r.image_url, 'designs'));

  const { data: signed } = await supabase.storage
    .from('designs')
    .createSignedUrls(paths, 3600);

  if (!signed) return;

  const expiresAt = new Date(Date.now() + 50 * 60 * 1000).toISOString();

  for (let i = 0; i < staleRows.length; i++) {
    const signedUrl = signed[i]?.signedUrl ?? null;
    await db.runAsync(
      `INSERT OR REPLACE INTO design_cache (design_id, signed_url, expires_at) VALUES (?, ?, ?)`,
      [staleRows[i].id, signedUrl, expiresAt]
    );
  }
}

export function useGallery() {
  const { isConnected } = useSyncContext();
  const { orgId } = useActiveOrg();
  const qc = useQueryClient();

  return useQuery({
    queryKey: ['gallery', orgId],
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const db = getDb();

      const rows = await db.getAllAsync<DesignRow>(
        `SELECT id, title, image_url, tags, uploaded_by, created_at
         FROM designs
         WHERE organization_id = ? AND _deleted = 0
         ORDER BY created_at DESC`,
        [orgId!]
      );

      if (rows.length === 0) return [];

      if (isConnected) {
        await refreshSignedUrls(db, rows).catch(() => {});
      }

      const result: DesignWithUrl[] = [];
      for (const row of rows) {
        const cache = await db.getFirstAsync<CacheRow>(
          'SELECT * FROM design_cache WHERE design_id=?',
          [row.id]
        );
        result.push(parseRow(row, cache ?? null));
      }

      return result;
    },
  });
}

export function useDesignById(id: string) {
  const { isConnected } = useSyncContext();
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['gallery', orgId, id],
    enabled: !!orgId && !!id,
    queryFn: async (): Promise<DesignWithUrl | null> => {
      const db = getDb();

      const row = await db.getFirstAsync<DesignRow>(
        `SELECT id, title, image_url, tags, uploaded_by, created_at
         FROM designs
         WHERE id=? AND organization_id=? AND _deleted=0`,
        [id, orgId!]
      );

      if (!row) return null;

      if (isConnected) {
        await refreshSignedUrls(db, [row]).catch(() => {});
      }

      const cache = await db.getFirstAsync<CacheRow>(
        'SELECT * FROM design_cache WHERE design_id=?',
        [id]
      );

      return parseRow(row, cache ?? null);
    },
  });
}
