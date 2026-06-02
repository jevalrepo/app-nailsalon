import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { logoPath, getExtFromUri, getMimeType } from '@/lib/storage/paths';

export function useLogoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { organizations, activeOrganizationId, setOrganizations } = useAuthStore();

  async function pickAndUpload(): Promise<string | null> {
    if (!activeOrganizationId) return null;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const ext = getExtFromUri(asset.uri);
    const path = logoPath(activeOrganizationId, ext);
    const mime = getMimeType(ext);

    setIsUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, blob, { contentType: mime, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', activeOrganizationId);

      if (updateError) throw updateError;

      // Actualizar la org en el store local
      const updated = organizations.map(o =>
        o.id === activeOrganizationId ? { ...o, logo_url: publicUrl } : o
      );
      setOrganizations(updated);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  }

  async function removeLogo(): Promise<void> {
    if (!activeOrganizationId) return;

    const org = organizations.find(o => o.id === activeOrganizationId);
    if (!org?.logo_url) return;

    setIsUploading(true);
    try {
      // Borrar todos los archivos del folder de la org en logos
      const { data: files } = await supabase.storage
        .from('logos')
        .list(activeOrganizationId);

      if (files && files.length > 0) {
        const paths = files.map(f => `${activeOrganizationId}/${f.name}`);
        await supabase.storage.from('logos').remove(paths);
      }

      await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', activeOrganizationId);

      const updated = organizations.map(o =>
        o.id === activeOrganizationId ? { ...o, logo_url: null } : o
      );
      setOrganizations(updated);
    } finally {
      setIsUploading(false);
    }
  }

  return { pickAndUpload, removeLogo, isUploading };
}
