import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/useThemeStore';
import { COLORS } from '@/constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  nameOutline,
  focused,
  color,
}: {
  name: IoniconsName;
  nameOutline: IoniconsName;
  focused: boolean;
  color: string;
}) {
  return <Ionicons name={focused ? name : nameOutline} size={24} color={color} />;
}

export default function TabsLayout() {
  const systemScheme = useColorScheme();
  const { colorScheme, accentHex } = useThemeStore();

  const effectiveScheme: 'light' | 'dark' =
    colorScheme === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : colorScheme;

  const colors = COLORS[effectiveScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accentHex,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: 8,
          height: 72,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" nameOutline="home-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Citas',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="calendar" nameOutline="calendar-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientas',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="people" nameOutline="people-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="finance"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="ellipsis-horizontal-circle" nameOutline="ellipsis-horizontal-circle-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
