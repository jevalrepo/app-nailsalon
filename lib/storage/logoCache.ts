import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { ImageExt } from './paths';

const LOGO_CACHE_KEY = 'coraline-logo-cache';

type LogoCacheMap = Record<string, string>;

async function readCacheMap(): Promise<LogoCacheMap> {
  const raw = await AsyncStorage.getItem(LOGO_CACHE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LogoCacheMap;
  } catch {
    return {};
  }
}

async function writeCacheMap(map: LogoCacheMap): Promise<void> {
  await AsyncStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(map));
}

function logoDir(orgId: string): Directory {
  return new Directory(Paths.document, 'logos', orgId);
}

function ensureLogoDir(orgId: string): Directory {
  const dir = logoDir(orgId);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function clearLogoDir(orgId: string): Directory {
  const dir = ensureLogoDir(orgId);
  for (const entry of dir.list()) {
    if (entry instanceof File) {
      entry.delete();
    }
  }
  return dir;
}

function cachedLogoFile(orgId: string, ext: ImageExt): File {
  return new File(logoDir(orgId), `logo.${ext}`);
}

export async function getCachedLogoUri(orgId: string): Promise<string | null> {
  const map = await readCacheMap();
  const uri = map[orgId];
  if (!uri) return null;

  const file = new File(uri);
  if (file.exists && file.size > 0) return file.uri;

  delete map[orgId];
  await writeCacheMap(map);
  return null;
}

export async function cacheLogoFromUri(orgId: string, sourceUri: string, ext: ImageExt): Promise<string> {
  clearLogoDir(orgId);
  const destination = cachedLogoFile(orgId, ext);
  new File(sourceUri).copy(destination);

  if (!destination.exists || destination.size === 0) {
    throw new Error('No se pudo guardar el logo localmente.');
  }

  const map = await readCacheMap();
  map[orgId] = destination.uri;
  await writeCacheMap(map);
  return destination.uri;
}

export async function cacheLogoFromUrl(orgId: string, url: string, ext: ImageExt): Promise<string | null> {
  try {
    const dir = clearLogoDir(orgId);
    const destination = new File(dir, `logo.${ext}`);
    const file = await File.downloadFileAsync(url, destination, { idempotent: true });
    if (!file.exists || file.size === 0) return null;

    const map = await readCacheMap();
    map[orgId] = file.uri;
    await writeCacheMap(map);
    return file.uri;
  } catch {
    return null;
  }
}

export async function removeCachedLogo(orgId: string): Promise<void> {
  clearLogoDir(orgId);
  const map = await readCacheMap();
  delete map[orgId];
  await writeCacheMap(map);
}
