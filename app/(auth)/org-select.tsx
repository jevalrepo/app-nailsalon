import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import type { Organization, TenantRole } from '@/types';

const ROLE_LABEL: Record<TenantRole, string> = {
  owner:    'Propietario',
  admin:    'Admin',
  employee: 'Empleada',
};

function OrgCard({
  org, role, onPress, colors, accent,
}: {
  org: Organization; role: TenantRole;
  onPress: () => void; colors: any; accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, padding: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Logo */}
      <View style={{
        width: 56, height: 56, borderRadius: 14,
        backgroundColor: org.logo_url ? 'transparent' : accent + '20',
        borderWidth: org.logo_url ? 0 : 1.5,
        borderColor: accent + '40',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {org.logo_url
          ? <Image source={{ uri: org.logo_url }} style={{ width: 56, height: 56 }} resizeMode="cover" />
          : <Ionicons name="sparkles" size={24} color={accent} />
        }
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {org.name}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
          {ROLE_LABEL[role]}
        </Text>
      </View>

      {/* Flecha */}
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: accent + '15',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="chevron-forward" size={18} color={accent} />
      </View>
    </Pressable>
  );
}

export default function OrgSelectScreen() {
  const { colors, accent } = useTheme();
  const { organizations, organizationRoles, isLoading, setActiveOrganization } = useAuthStore();

  function handleSelect(org: Organization) {
    const role = organizationRoles[org.id] ?? 'employee';
    setActiveOrganization(org.id, role);
    router.replace('/');
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, backgroundColor: accent + '12' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={{ paddingTop: 56, paddingBottom: 36, alignItems: 'center' }}>
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: accent,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
          }}>
            <Ionicons name="sparkles" size={30} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
            Selecciona tu salón
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Tienes acceso a {organizations.length} salones
          </Text>
        </View>

        {/* Tarjetas */}
        {organizations.map((org) => (
          <OrgCard
            key={org.id}
            org={org}
            role={organizationRoles[org.id] ?? 'employee'}
            onPress={() => handleSelect(org)}
            colors={colors}
            accent={accent}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
