import {
  View, Text, Pressable, FlatList, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useEmployees } from '@/hooks/useEmployees';
import { useChangeEmployeeRole } from '@/hooks/useEmployeeMutations';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile, UserRole } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function RolePill({ role, accent }: { role: UserRole; accent: string }) {
  const isAdmin = role === 'admin';
  return (
    <View style={{
      backgroundColor: isAdmin ? accent + '20' : '#6EE7B720',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    }}>
      <Text style={{
        fontSize: 11, fontWeight: '600',
        color: isAdmin ? accent : '#059669',
      }}>
        {isAdmin ? 'Admin' : 'Staff'}
      </Text>
    </View>
  );
}

function UserCard({
  employee,
  currentUserId,
  colors,
  accent,
  onToggleRole,
  onViewDetail,
}: {
  employee: Profile;
  currentUserId: string | undefined;
  colors: any;
  accent: string;
  onToggleRole: (employee: Profile) => void;
  onViewDetail: (id: string) => void;
}) {
  const isSelf = employee.id === currentUserId;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderRadius: 20,
      padding: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}>
      <Pressable onPress={() => onViewDetail(employee.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={employee.full_name} uri={employee.avatar_url ?? undefined} size="md" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
              {employee.full_name}
            </Text>
            {isSelf && (
              <View style={{
                backgroundColor: colors.surface, borderRadius: 6,
                paddingHorizontal: 6, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 10, color: colors.textTertiary, fontWeight: '500' }}>Tú</Text>
              </View>
            )}
          </View>
          {employee.phone ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{employee.phone}</Text>
          ) : (
            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>Sin teléfono</Text>
          )}
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <RolePill role={employee.role} accent={accent} />
        {!isSelf && (
          <Pressable
            onPress={() => onToggleRole(employee)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function StatChip({ label, value, colors, accent }: { label: string; value: number; colors: any; accent: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: accent + '15', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 6,
    }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: accent }}>{value}</Text>
      <Text style={{ fontSize: 12, color: accent, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

export default function AdminUsersScreen() {
  const { colors, accent } = useTheme();
  const { data: employees, isLoading, error } = useEmployees();
  const changeRole = useChangeEmployeeRole();
  const { orgRole } = useActiveOrg();

  if (orgRole !== 'admin' && orgRole !== 'owner') return <Redirect href="/(app)/(tabs)" />;

  function handleToggleRole(employee: Profile) {
    const newRole: UserRole = employee.role === 'admin' ? 'employee' : 'admin';
    const newRoleLabel = newRole === 'admin' ? 'Administrador' : 'Empleada';

    Alert.alert(
      'Cambiar rol',
      `¿Cambiar a ${employee.full_name} a ${newRoleLabel}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            changeRole.mutate(
              { id: employee.id, role: newRole },
              {
                onError: () =>
                  Alert.alert('Error', 'No se pudo cambiar el rol. Intenta de nuevo.'),
              }
            );
          },
        },
      ]
    );
  }

  const totalAdmins   = (employees ?? []).filter(e => e.role === 'admin').length;
  const totalStaff    = (employees ?? []).filter(e => e.role === 'employee').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flex: 1 })}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
            Usuarios y roles
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/employee/new')}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: accent,
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Chips resumen */}
      {(employees?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 16 }}
        >
          <StatChip label="total" value={employees?.length ?? 0} colors={colors} accent={accent} />
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: colors.surface, borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Ionicons name="shield-checkmark" size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
              {totalAdmins} admin{totalAdmins !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: colors.surface, borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
              {totalStaff} staff
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Nota informativa */}
      <View style={{
        marginHorizontal: 20, marginBottom: 16,
        backgroundColor: accent + '12',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <Ionicons name="information-circle-outline" size={16} color={accent} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 12, color: accent, lineHeight: 17 }}>
          Usa el ícono <Ionicons name="swap-horizontal-outline" size={12} color={accent} /> para cambiar el rol de una empleada. No puedes cambiar tu propio rol.
        </Text>
      </View>

      {/* Contenido */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accent} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>
            Error al cargar usuarios
          </Text>
        </View>
      ) : (employees?.length ?? 0) === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: accent + '18',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="people-outline" size={34} color={accent} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
            Sin usuarios
          </Text>
          <Pressable
            onPress={() => router.push('/employee/new')}
            style={({ pressed }) => ({
              marginTop: 20,
              backgroundColor: accent, borderRadius: 14,
              paddingHorizontal: 24, paddingVertical: 12,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Agregar empleada</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <UserCard
              employee={item}
              currentUserId={profile?.id}
              colors={colors}
              accent={accent}
              onToggleRole={handleToggleRole}
              onViewDetail={(id) => router.push(`/employee/${id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
