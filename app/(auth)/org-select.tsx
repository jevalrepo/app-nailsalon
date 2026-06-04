import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { useCachedLogoUri } from '@/hooks/useCachedLogoUri';
import type { Organization, TenantRole } from '@/types';

const ROLE_LABEL: Record<TenantRole, string> = {
  owner:    'Propietario',
  admin:    'Administrador',
  employee: 'Empleada',
};

const ROLE_ICON: Record<TenantRole, string> = {
  owner:    'ribbon',
  admin:    'shield-checkmark',
  employee: 'person',
};

function OrgCard({
  org, role, onPress, colors, accent,
}: {
  org: Organization; role: TenantRole;
  onPress: () => void; colors: any; accent: string;
}) {
  const cachedLogoUri = useCachedLogoUri(org.id, org.logo_url);
  const logoUri = cachedLogoUri ?? org.logo_url;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surfaceElevated,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {/* Franja de color superior */}
      <View style={{ height: 4, backgroundColor: accent + '60' }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
        {/* Logo / Avatar */}
        <View style={{
          width: 52, height: 52, borderRadius: 12,
          backgroundColor: logoUri ? 'transparent' : accent + '18',
          borderWidth: logoUri ? 0 : 1.5,
          borderColor: accent + '30',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {logoUri
            ? <Image source={{ uri: logoUri }} style={{ width: 52, height: 52 }} resizeMode="cover" />
            : <Ionicons name="sparkles" size={22} color={accent} />
          }
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
            {org.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name={ROLE_ICON[role] as any} size={12} color={accent} />
            <Text style={{ fontSize: 12, color: accent, fontWeight: '500' }}>
              {ROLE_LABEL[role]}
            </Text>
          </View>
        </View>

        {/* Flecha */}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

export default function OrgSelectScreen() {
  const { colors, accent } = useTheme();
  const { organizations, organizationRoles, isLoading, setActiveOrganization, activeOrganizationId } = useAuthStore();

  const canGoBack = !!activeOrganizationId;

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
      {/* Fondo degradado sutil */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240, backgroundColor: accent + '10' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Botón regresar */}
        {canGoBack && (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingTop: 12, paddingBottom: 4,
              alignSelf: 'flex-start',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 15, color: accent, fontWeight: '600' }}>Regresar</Text>
          </Pressable>
        )}

        {/* Header */}
        <View style={{ paddingTop: canGoBack ? 20 : 48, paddingBottom: 32, alignItems: 'center' }}>
          <View style={{
            width: 68, height: 68, borderRadius: 20,
            backgroundColor: accent,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <Ionicons name="sparkles" size={30} color="#fff" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
            Selecciona tu salón
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
            {organizations.length === 1
              ? 'Tienes acceso a 1 salón'
              : `Tienes acceso a ${organizations.length} salones`}
          </Text>
        </View>

        {/* Sección */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 }}>
          Mis salones
        </Text>

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
