import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasCompletedSetup: boolean;
  setHasSeenOnboarding: (v: boolean) => void;
  setHasCompletedSetup: (v: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasCompletedSetup: false,
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
      setHasCompletedSetup: (v) => set({ hasCompletedSetup: v }),
      reset: () => set({ hasSeenOnboarding: false, hasCompletedSetup: false }),
    }),
    {
      name: 'coraline-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
