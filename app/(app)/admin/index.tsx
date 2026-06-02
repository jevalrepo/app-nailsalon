import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEmployees } from '@/hooks/useEmployees';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function AdminRow({
  icon,
  label,
  description,
  onPress,
  colors,
  accent,
  badge,
  isLast = false,
}: {
  icon: IoniconsName;
  label: string;
  description: string;
  onPress: () => void;
  colors: any;
  accent: string;
  badge?: string | number;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderLight,
      }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: accent + '18',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {label}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {description}
          </Text>
        </View>
        {badge !== undefined && (
          <View style={{
            backgroundColor: accent + '20',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginRight: 4,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase',
      marginBottom: 10, paddingHorizontal: 4,
    }}>
      {label}
    </Text>
  );
}

function SectionCard({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <View style={{
      backgroundColor: colors.surfaceElevated,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}>
      {children}
    </View>
  );
}

export default function AdminPanel() {
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const { data: employees } = useEmployees();

  if (profile?.role !== 'admin') return <Redirect href="/(app)/(tabs)" />;

  const totalUsers = employees?.length ?? 0;
  const totalAdmins = (employees ?? []).filter(e => e.role === 'admin').length;
  const totalStaff  = (employees ?? []).filter(e => e.role === 'employee').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
        }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flex: 1 })}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
              Administración
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* Negocio */}
          <SectionLabel label="Negocio" colors={colors} />
          <SectionCard colors={colors}>
            <AdminRow
              icon="storefront-outline"
              label="Datos del negocio"
              description="Nombre, teléfono, dirección e Instagram"
              onPress={() => router.push('/admin/business')}
              colors={colors}
              accent={accent}
            />
            <AdminRow
              icon="time-outline"
              label="Horario y preferencias"
              description="Horario de atención, recordatorios"
              onPress={() => router.push('/admin/config')}
              colors={colors}
              accent={accent}
              isLast
            />
          </SectionCard>

          {/* Usuarios */}
          <SectionLabel label="Usuarios" colors={colors} />
          <SectionCard colors={colors}>
            <AdminRow
              icon="people-outline"
              label="Empleadas"
              description={`${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} registrado${totalUsers !== 1 ? 's' : ''}`}
              onPress={() => router.push('/employee')}
              colors={colors}
              accent={accent}
              badge={totalUsers > 0 ? totalUsers : undefined}
            />
            <AdminRow
              icon="shield-checkmark-outline"
              label="Roles y permisos"
              description={`${totalAdmins} admin · ${totalStaff} staff`}
              onPress={() => router.push('/admin/users')}
              colors={colors}
              accent={accent}
              isLast
            />
          </SectionCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
