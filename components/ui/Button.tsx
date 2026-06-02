import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  label: string;
  style?: ViewStyle;
}

const SIZES: Record<Size, { py: number; px: number; fontSize: number; minH: number }> = {
  sm: { py: 8,  px: 14, fontSize: 14, minH: 36 },
  md: { py: 13, px: 20, fontSize: 16, minH: 44 },
  lg: { py: 16, px: 24, fontSize: 17, minH: 52 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  label,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, accent, isDark } = useTheme();
  const sz = SIZES[size];
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: sz.py,
    paddingHorizontal: sz.px,
    minHeight: sz.minH,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    opacity: isDisabled ? 0.5 : 1,
    ...getVariantStyle(variant, accent, colors, isDark),
    ...style,
  };

  const textStyle: TextStyle = {
    fontSize: sz.fontSize,
    fontWeight: '600',
    color: getTextColor(variant, accent, colors),
  };

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, { opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 }]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'secondary' ? accent : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

function getVariantStyle(
  variant: Variant,
  accent: string,
  colors: { border: string; destructive: string; [key: string]: string },
  isDark: boolean,
): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: accent };
    case 'secondary':
      return {
        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F2',
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'destructive':
      return { backgroundColor: colors.destructive };
  }
}

function getTextColor(
  variant: Variant,
  accent: string,
  colors: { text: string; [key: string]: string },
): string {
  switch (variant) {
    case 'primary':
      return '#FFFFFF';
    case 'secondary':
      return colors.text;
    case 'ghost':
      return accent;
    case 'destructive':
      return '#FFFFFF';
  }
}
