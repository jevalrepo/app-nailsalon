import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { logoPath, getExtFromUri, getMimeType } from '@/lib/storage/paths';
import type { ImageExt } from '@/lib/storage/paths';
import { cacheLogoFromUri, removeCachedLogo } from '@/lib/storage/logoCache';
import type { Organization } from '@/types';

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getLogoExt(asset: ImagePicker.ImagePickerAsset): ImageExt {
  if (asset.mimeType === 'image/jpeg') return 'jpg';
  if (asset.mimeType === 'image/png') return 'png';
  if (asset.mimeType === 'image/webp') return 'webp';
  return getExtFromUri(asset.uri);
}

export function useLogoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null);
  const [pendingAsset, setPendingAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState(false);
  const { organizations, activeOrganizationId, setOrganizations } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    void ImagePicker.getMediaLibraryPermissionsAsync().catch(() => undefined);
  }, []);

  async function pickLogo(): Promise<void> {
    if (!activeOrganizationId) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = getLogoExt(asset);
    const localUri = await cacheLogoFromUri(activeOrganizationId, asset.uri, ext);
    setLogoPreviewUri(localUri);
    setPendingAsset({ ...asset, uri: localUri });
    setPendingRemoval(false);
  }

  function markLogoForRemoval(): void {
    setLogoPreviewUri(null);
    setPendingAsset(null);
    setPendingRemoval(true);
  }

  function clearPendingLogo(): void {
    setLogoPreviewUri(null);
    setPendingAsset(null);
    setPendingRemoval(false);
  }

  function clearPendingSelection(): void {
    setPendingAsset(null);
    setPendingRemoval(false);
  }

  async function savePendingLogo(): Promise<void> {
    if (!activeOrganizationId || (!pendingAsset && !pendingRemoval)) return;

    setIsUploading(true);
    try {
      if (pendingRemoval) {
        const { data: files } = await supabase.storage
          .from('logos')
          .list(activeOrganizationId);

        if (files && files.length > 0) {
          const paths = files.map(f => `${activeOrganizationId}/${f.name}`);
          await supabase.storage.from('logos').remove(paths);
        }

        const { error: updateError } = await supabase
          .from('organizations')
          .update({ logo_url: null })
          .eq('id', activeOrganizationId)
          .select('id')
          .single();

        if (updateError) throw updateError;

        await removeCachedLogo(activeOrganizationId);

        const updated = organizations.map(o =>
          o.id === activeOrganizationId ? { ...o, logo_url: null } : o
        );
        setOrganizations(updated);
        qc.setQueryData<Organization | null>(['org', activeOrganizationId], (current) =>
          current ? { ...current, logo_url: null } : null
        );
        qc.invalidateQueries({ queryKey: ['org', activeOrganizationId] });
        clearPendingLogo();
        return;
      }

      if (!pendingAsset) return;

      const asset = pendingAsset;
      const ext = getLogoExt(asset);
      const path = logoPath(activeOrganizationId, ext);
      const mime = getMimeType(ext);

      const arrayBuffer = await uriToArrayBuffer(asset.uri);
      if (arrayBuffer.byteLength === 0) {
        throw new Error('El archivo seleccionado está vacío.');
      }

      const { data: existingFiles } = await supabase.storage
        .from('logos')
        .list(activeOrganizationId);

      if (existingFiles && existingFiles.length > 0) {
        const paths = existingFiles.map(f => `${activeOrganizationId}/${f.name}`);
        await supabase.storage.from('logos').remove(paths);
      }

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, arrayBuffer, { contentType: mime, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', activeOrganizationId)
        .select('id')
        .single();

      if (updateError) throw updateError;

      // Actualizar la org en el store local
      const updated = organizations.map(o =>
        o.id === activeOrganizationId ? { ...o, logo_url: publicUrl } : o
      );
      setOrganizations(updated);
      qc.setQueryData<Organization | null>(['org', activeOrganizationId], (current) =>
        current ? { ...current, logo_url: publicUrl } : updated.find(o => o.id === activeOrganizationId) ?? null
      );
      qc.invalidateQueries({ queryKey: ['org', activeOrganizationId] });
      clearPendingSelection();
    } finally {
      setIsUploading(false);
    }
  }

  return {
    pickLogo,
    markLogoForRemoval,
    savePendingLogo,
    isUploading,
    logoPreviewUri,
    logoDirty: !!pendingAsset || pendingRemoval,
    logoMarkedForRemoval: pendingRemoval,
  };
}
