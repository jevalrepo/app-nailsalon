import { useEffect, useState } from 'react';
import { cacheLogoFromUrl, getCachedLogoUri } from '@/lib/storage/logoCache';
import { getExtFromUri } from '@/lib/storage/paths';

export function useCachedLogoUri(orgId: string | null | undefined, remoteUrl: string | null | undefined) {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLogo() {
      if (!orgId) {
        setLocalUri(null);
        return;
      }

      const cached = await getCachedLogoUri(orgId);
      if (cancelled) return;

      if (cached) {
        setLocalUri(cached);
        return;
      }

      setLocalUri(null);

      if (!remoteUrl) return;

      const downloaded = await cacheLogoFromUrl(orgId, remoteUrl, getExtFromUri(remoteUrl));
      if (!cancelled && downloaded) {
        setLocalUri(downloaded);
      }
    }

    loadLogo();
    return () => {
      cancelled = true;
    };
  }, [orgId, remoteUrl]);

  return localUri;
}
