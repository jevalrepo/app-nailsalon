import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface QueueEntry {
  id: string;
  table: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  rowId: string;
  organization_id: string | null;
  createdAt: string;
  retries: number;
  dependsOn?: string; // id of another QueueEntry that must be processed first
}

interface SyncQueueState {
  queue: QueueEntry[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  enqueue: (entry: Omit<QueueEntry, 'id' | 'createdAt' | 'retries'>) => void;
  dequeue: (id: string) => void;
  markRetry: (id: string) => void;
  clearCompleted: () => void;
  setIsSyncing: (v: boolean) => void;
  setLastSyncAt: (v: string) => void;
}

export const useSyncQueue = create<SyncQueueState>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      lastSyncAt: null,

      enqueue: (entry) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createdAt: new Date().toISOString(),
              retries: 0,
            },
          ],
        })),

      dequeue: (id) =>
        set((state) => ({
          queue: state.queue.filter((e) => e.id !== id),
        })),

      markRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((e) =>
            e.id === id ? { ...e, retries: e.retries + 1 } : e
          ),
        })),

      clearCompleted: () =>
        set((state) => ({
          queue: state.queue.filter((e) => e.retries < 3),
        })),

      setIsSyncing: (v) => set({ isSyncing: v }),
      setLastSyncAt: (v) => set({ lastSyncAt: v }),
    }),
    {
      name: 'coraline-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
