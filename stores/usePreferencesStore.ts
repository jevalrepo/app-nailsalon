import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesState {
  notificationLeadMinutes: number; // Minutos de anticipación para recordatorios
  setNotificationLeadMinutes: (minutes: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      notificationLeadMinutes: 60,
      setNotificationLeadMinutes: (notificationLeadMinutes) =>
        set({ notificationLeadMinutes }),
    }),
    {
      name: 'coraline-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
