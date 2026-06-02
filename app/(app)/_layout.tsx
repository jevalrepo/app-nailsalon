import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';

export default function AppLayout() {
  const { session, isLoading } = useAuthStore();
  const { colors, accent } = useTheme();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
