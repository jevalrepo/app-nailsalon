import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'accent';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string; darkBg: string; darkText: string }> = {
  success:  { bg: '#E8FAF0', text: '#1A8A45', darkBg: '#1A3D2B', darkText: '#4ADE80' },
  warning:  { bg: '#FFF4E0', text: '#B45309', darkBg: '#3D2E0E', darkText: '#FBBF24' },
  error:    { bg: '#FFF0EF', text: '#DC2626', darkBg: '#3D1515', darkText: '#F87171' },
  neutral:  { bg: '#F2F2F2', text: '#6B6B6B', darkBg: '#2C2C2E', darkText: '#A0A0A0' },
  accent:   { bg: '#FEF5F3', text: '#E86E59', darkBg: '#3D1E18', darkText: '#F4A99A' },
};

const SIZES: Record<BadgeSize, { py: number; px: number; fontSize: number; borderRadius: number }> = {
  sm: { py: 2,  px: 8,  fontSize: 11, borderRadius: 8  },
  md: { py: 4,  px: 12, fontSize: 13, borderRadius: 10 },
};

export function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  const { isDark } = useTheme();
  const cv = VARIANT_COLORS[variant];
  const sz = SIZES[size];

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    paddingVertical: sz.py,
    paddingHorizontal: sz.px,
    borderRadius: sz.borderRadius,
    backgroundColor: isDark ? cv.darkBg : cv.bg,
  };

  const textStyle: TextStyle = {
    fontSize: sz.fontSize,
    fontWeight: '600',
    color: isDark ? cv.darkText : cv.text,
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
