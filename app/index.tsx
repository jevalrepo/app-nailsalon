import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { session, profile, isLoading } = useAuthStore();
  const { hasSeenOnboarding, hasCompletedSetup } = useOnboardingStore();
  const { colors, accent } = useTheme();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  // Primera vez — mostrar onboarding
  if (!hasSeenOnboarding) return <Redirect href="/(auth)/onboarding" />;

  // Admin que no ha completado el setup del negocio
  if (profile?.role === 'admin' && !hasCompletedSetup) {
    return <Redirect href="/(auth)/setup" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
