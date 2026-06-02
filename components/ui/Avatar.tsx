import { View, Text, Image, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  xs: 11,
  sm: 14,
  md: 17,
  lg: 22,
  xl: 28,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const palette = ['#F4A99A', '#C4B5FD', '#FDA4AF', '#6EE7B7', '#7DD3FC', '#FDBA74'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, uri, size = 'md', style }: AvatarProps) {
  const { isDark } = useTheme();
  const dim = SIZES[size];
  const fs = FONT_SIZES[size];
  const initials = getInitials(name);
  const bgColor = name ? getColorFromName(name) : '#E5E5EA';

  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bgColor,
  };

  return (
    <View style={[containerStyle, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: dim, height: dim }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: fs, fontWeight: '600', color: '#FFFFFF' }}>
          {initials}
        </Text>
      )}
    </View>
  );
}
