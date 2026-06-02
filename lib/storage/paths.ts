// Storage path helpers — única fuente de verdad para nombres de archivos.
//
// Convenciones por bucket:
//   avatars       → {userId}/avatar.{ext}
//   designs       → {orgId}/{userId}/{timestamp}.{ext}
//   client-photos → {orgId}/{clientId}/{timestamp}.{ext}
//
// Las políticas RLS de Storage (migración 005) validan el primer segmento del path
// contra get_my_organizations() para designs y client-photos, y contra auth.uid()
// para avatars — por lo tanto NUNCA cambiar el orden de los segmentos.

export type ImageExt = 'jpg' | 'jpeg' | 'png' | 'webp' | 'heic';

export const MIME_TYPES: Record<ImageExt, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

export function getExtFromUri(uri: string): ImageExt {
  const match = uri.match(/\.(\w+)(\?|$)/);
  const raw = match?.[1]?.toLowerCase() ?? 'jpg';
  return (raw in MIME_TYPES ? raw : 'jpg') as ImageExt;
}

export function getMimeType(ext: ImageExt): string {
  return MIME_TYPES[ext] ?? 'image/jpeg';
}

// ── Path builders ────────────────────────────────────────────────────────────

/** avatars/{userId}/avatar.{ext}  */
export function avatarPath(userId: string, ext: ImageExt): string {
  return `${userId}/avatar.${ext}`;
}

/** designs/{orgId}/{userId}/{timestamp}.{ext}  */
export function designPath(orgId: string, userId: string, ext: ImageExt): string {
  return `${orgId}/${userId}/${Date.now()}.${ext}`;
}

/** client-photos/{orgId}/{clientId}/{timestamp}.{ext}  */
export function clientPhotoPath(orgId: string, clientId: string, ext: ImageExt): string {
  return `${orgId}/${clientId}/${Date.now()}.${ext}`;
}

// ── Path parser (signed URL → storage path) ──────────────────────────────────

/**
 * Extrae el path relativo dentro del bucket desde una signed URL o un path
 * ya limpio. Devuelve el valor tal cual si no tiene el prefijo de Supabase.
 */
export function extractStoragePath(urlOrPath: string, bucket: string): string {
  if (!urlOrPath.startsWith('http')) return urlOrPath;
  const marker = `/${bucket}/`;
  const idx = urlOrPath.indexOf(marker);
  return idx >= 0 ? urlOrPath.slice(idx + marker.length) : urlOrPath;
}
