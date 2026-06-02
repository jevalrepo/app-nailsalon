import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { avatarPath, getExtFromUri, getMimeType } from '@/lib/storage/paths';

// Avatares son públicos y pertenecen al usuario (no a la org).
// Path: avatars/{userId}/avatar.{ext}
// El bucket es público — se usa getPublicUrl, no createSignedUrl.

interface AvatarUploadResult {
  publicUrl: string;
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

export function useAvatarUpload() {
  const { profile, setProfile } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload(): Promise<AvatarUploadResult | null> {
    if (!profile) return null;

    setError(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Se necesita permiso para acceder a la galería.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    if (!asset?.uri) return null;

    setUploading(true);
    try {
      const ext = getExtFromUri(asset.uri);
      const path = avatarPath(profile.id, ext);
      const contentType = getMimeType(ext);
      const arrayBuffer = await uriToArrayBuffer(asset.uri);

      // upsert: true para reemplazar el avatar anterior
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Guardar la URL en el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      setProfile({ ...profile, avatar_url: publicUrl });

      return { publicUrl };
    } catch (e: any) {
      setError(e?.message ?? 'Error al subir la foto.');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar(): Promise<void> {
    if (!profile?.avatar_url) return;
    setUploading(true);
    setError(null);
    try {
      // Intentar borrar el archivo de Storage (falla silenciosa si no existe)
      const ext = getExtFromUri(profile.avatar_url);
      const path = avatarPath(profile.id, ext);
      await supabase.storage.from('avatars').remove([path]);

      await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
      setProfile({ ...profile, avatar_url: null });
    } catch (e: any) {
      setError(e?.message ?? 'Error al eliminar la foto.');
    } finally {
      setUploading(false);
    }
  }

  return { pickAndUpload, removeAvatar, uploading, error };
}
