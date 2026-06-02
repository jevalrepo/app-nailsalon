import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/database';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { designPath, getExtFromUri, getMimeType, extractStoragePath } from '@/lib/storage/paths';

// Galería: subida y eliminación son solo-online (requieren Supabase Storage)
// Los botones deben estar deshabilitados cuando !isConnected (gating en UI)

interface UploadDesignPayload {
  localUri: string;
  title: string;
  tags: string[];
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useUploadDesign() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async ({ localUri, title, tags }: UploadDesignPayload) => {
      if (!profile) throw new Error('No autenticado');
      if (!orgId) throw new Error('No hay organización activa');

      const ext = getExtFromUri(localUri);
      const fileName = designPath(orgId, profile.id, ext);
      const contentType = getMimeType(ext);
      const arrayBuffer = await uriToArrayBuffer(localUri);

      const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(fileName, arrayBuffer, { contentType, upsert: false });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('designs')
        .insert({ organization_id: orgId, title: title.trim(), image_url: fileName, tags, uploaded_by: profile.id })
        .select('id, title, image_url, tags, uploaded_by, created_at')
        .single();

      if (insertError) {
        await supabase.storage.from('designs').remove([fileName]);
        throw insertError;
      }

      const db = getDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO designs (id, organization_id, title, image_url, tags, uploaded_by, created_at, _synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [data.id, orgId, data.title, data.image_url, JSON.stringify(data.tags ?? []), data.uploaded_by, data.created_at]
      );

      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery', orgId] }),
  });
}

export function useDeleteDesign() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async ({ id, imagePath }: { id: string; imagePath: string }) => {
      const { error: deleteError } = await supabase.from('designs').delete().eq('id', id);
      if (deleteError) throw deleteError;

      const path = extractStoragePath(imagePath, 'designs');

      if (path) {
        await supabase.storage.from('designs').remove([path]);
      }

      const db = getDb();
      await db.runAsync('DELETE FROM designs WHERE id=?', [id]);
      await db.runAsync('DELETE FROM design_cache WHERE design_id=?', [id]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery', orgId] }),
  });
}
