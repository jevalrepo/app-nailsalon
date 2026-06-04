import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { session, isLoading, organizations, activeOrganizationId, orgsLoaded } = useAuthStore();
  const { orgRole } = useActiveOrg();
  const { branchId, branches } = useActiveBranch();
  const { hasSeenOnboarding, hasCompletedSetup } = useOnboardingStore();
  const { colors, accent } = useTheme();

  // Esperar a que auth y orgs estén listos
  if (isLoading || (session && !orgsLoaded)) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  if (!hasSeenOnboarding) return <Redirect href="/(auth)/onboarding" />;

  if ((orgRole === 'admin' || orgRole === 'owner') && !hasCompletedSetup) {
    return <Redirect href="/(auth)/setup" />;
  }

  // Sin organización activa → elegir
  if (!activeOrganizationId && organizations.length > 1) {
    return <Redirect href="/(auth)/org-select" />;
  }

  // Múltiples sucursales y ninguna seleccionada → elegir sucursal
  if (branches.length > 1 && !branchId) {
    return <Redirect href="/(auth)/branch-select" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
