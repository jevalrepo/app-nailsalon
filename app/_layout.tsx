import '@/lib/polyfills';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/useThemeStore';
import { useSession } from '@/hooks/useSession';
import { SyncProvider } from '@/lib/sync/SyncProvider';
import { initDatabase } from '@/lib/db/database';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,       // 1 hora — SQLite local siempre fresco
      retry: 0,                          // sin retry — queries locales no fallan por red
      gcTime: 1000 * 60 * 60 * 24,     // 24h de cache
    },
  },
});

function RootLayoutNav() {
  const systemScheme = useColorScheme();
  const { colorScheme } = useThemeStore();

  const effectiveScheme: 'light' | 'dark' =
    colorScheme === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : colorScheme;
  const colors = COLORS[effectiveScheme];

  useSession();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          gestureEnabled: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Error inicializando DB local:', err);
        setDbReady(true); // continuar aunque falle para no quedar bloqueado
      });
  }, []);

  if (!dbReady) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SyncProvider>
          <RootLayoutNav />
        </SyncProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
