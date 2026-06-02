import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { COLORS, ACCENT_COLORS } from '@/constants/colors';

export function useTheme() {
  const systemScheme = useColorScheme() ?? 'light';
  const { colorScheme, accentColor, accentHex } = useThemeStore();

  const resolved = colorScheme === 'system' ? systemScheme : colorScheme;
  const isDark = resolved === 'dark';
  const colors = COLORS[resolved];

  return {
    isDark,
    resolved,
    colors,
    accent: accentHex,
    accentColor,
    ACCENT_COLORS,
  };
}
