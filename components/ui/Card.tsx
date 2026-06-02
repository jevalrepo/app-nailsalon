import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type CardVariant = 'flat' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: number;
  style?: ViewStyle;
}

export function Card({
  variant = 'flat',
  padding = 16,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, isDark } = useTheme();

  const base: ViewStyle = {
    borderRadius: 20,
    padding,
    backgroundColor: colors.surfaceElevated,
  };

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'flat':
        return {};
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.18 : 0.06,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  })();

  return (
    <View style={[base, variantStyle, style]} {...rest}>
      {children}
    </View>
  );
}
