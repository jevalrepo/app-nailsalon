import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { processSyncQueue, pullFromSupabase, clearOrgCache } from '@/lib/sync/syncManager';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBranches } from '@/hooks/useBranches';

interface SyncContextValue {
  isConnected: boolean | null;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  isConnected: null,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  triggerSync: async () => {},
});

export function useSyncContext() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useNetworkStatus();
  const { queue, isSyncing, lastSyncAt } = useSyncQueue();
  const { session, activeOrganizationId } = useAuthStore();
  // Carga branches automáticamente cuando hay una org activa
  useBranches();
  const queryClient = useQueryClient();
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const isSyncingRef = useRef(false);

  // Refs para leer siempre el valor actual en closures
  const isConnectedRef = useRef(isConnected);
  const sessionRef = useRef(session);
  const activeOrgIdRef = useRef(activeOrganizationId);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { activeOrgIdRef.current = activeOrganizationId; }, [activeOrganizationId]);

  const triggerSync = async () => {
    if (!isConnectedRef.current || !sessionRef.current) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncingLocal(true);

    const orgId = activeOrgIdRef.current ?? undefined;

    // Timeout de 15s — si Supabase no responde, abortar
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('sync_timeout')), 15_000)
    );

    try {
      await Promise.race([
        (async () => {
          await processSyncQueue();
          await pullFromSupabase(orgId);
          await queryClient.invalidateQueries({ refetchType: 'all' });
        })(),
        timeoutPromise,
      ]);
    } catch {
      // Error de red o timeout — silencioso, la cola sigue pendiente
    } finally {
      isSyncingRef.current = false;
      setIsSyncingLocal(false);
    }
  };

  // Sync cuando recupera conexión
  useEffect(() => {
    if (isConnected && session) {
      triggerSync();
    }
  }, [isConnected]);

  // Sync inicial cuando llega la sesión
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => { triggerSync(); }, 100);
    return () => clearTimeout(timer);
  }, [session]);

  // Al cambiar de organización activa: limpiar caché local y hacer pull fresco
  const prevOrgIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeOrganizationId) return;
    if (prevOrgIdRef.current === activeOrganizationId) return;

    const prev = prevOrgIdRef.current;
    prevOrgIdRef.current = activeOrganizationId;

    // Limpiar siempre al cambiar de org (incluyendo primera carga)
    clearOrgCache(activeOrganizationId).then(() => {
      queryClient.clear();
      if (isConnectedRef.current && sessionRef.current) {
        triggerSync();
      }
    });
  }, [activeOrganizationId]);

  // Polling cada 30s — solo si hay conexión Y hay pendientes
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      if (!isConnectedRef.current) return; // no intentar sin red
      const { queue } = useSyncQueue.getState();
      if (queue.filter((e) => e.retries < 3).length > 0) {
        triggerSync();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <SyncContext.Provider
      value={{
        isConnected,
        isSyncing: isSyncing || isSyncingLocal,
        pendingCount: queue.filter((e) => e.retries < 3).length,
        lastSyncAt,
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}
