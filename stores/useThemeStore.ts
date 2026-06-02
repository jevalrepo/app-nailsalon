import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCENT_COLORS, AccentColor, DEFAULT_ACCENT } from '@/constants/colors';
import type { ColorScheme } from '@/constants/theme';

interface ThemeState {
  colorScheme: ColorScheme;
  accentColor: AccentColor;
  accentHex: string;
  setColorScheme: (scheme: ColorScheme) => void;
  setAccentColor: (color: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colorScheme: 'system',
      accentColor: DEFAULT_ACCENT,
      accentHex: ACCENT_COLORS[DEFAULT_ACCENT],

      setColorScheme: (colorScheme) => set({ colorScheme }),

      setAccentColor: (accentColor) =>
        set({ accentColor, accentHex: ACCENT_COLORS[accentColor] }),
    }),
    {
      name: 'coraline-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
