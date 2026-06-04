import {
  View, Text, Pressable, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function RoleBadge({ role, accent }: { role: string; accent: string }) {
  const isAdmin = role === 'admin';
  return (
    <View style={{
      backgroundColor: isAdmin ? accent + '20' : '#6EE7B720',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    }}>
      <Text style={{
        fontSize: 11,
        fontWeight: '600',
        color: isAdmin ? accent : '#059669',
      }}>
        {isAdmin ? 'Admin' : 'Empleada'}
      </Text>
    </View>
  );
}

function EmployeeCard({
  employee,
  colors,
  accent,
  onPress,
}: {
  employee: Profile;
  colors: any;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
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
        <Avatar
          name={employee.full_name}
          uri={employee.avatar_url ?? undefined}
          size="md"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {employee.full_name}
          </Text>
          {employee.phone ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              {employee.phone}
            </Text>
          ) : (
            <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 2 }}>
              Sin teléfono
            </Text>
          )}
        </View>
        <RoleBadge role={employee.role} accent={accent} />
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} style={{ marginLeft: 6 }} />
      </View>
    </Pressable>
  );
}

function EmptyState({ colors, accent, isAdmin }: { colors: any; accent: string; isAdmin: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: accent + '18',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Ionicons name="people-outline" size={34} color={accent} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
        Sin empleadas
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
        {isAdmin
          ? 'Agrega tu primera empleada para comenzar a asignar citas.'
          : 'Aún no hay empleadas registradas.'}
      </Text>
      {isAdmin && (
        <Pressable
          onPress={() => router.push('/employee/new')}
          style={({ pressed }) => ({
            marginTop: 24,
            backgroundColor: accent,
            borderRadius: 14,
            paddingHorizontal: 24,
            paddingVertical: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
            Agregar empleada
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function EmployeeListScreen() {
  const { colors, accent } = useTheme();
  const { orgRole } = useActiveOrg();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';
  const { data: employees, isLoading, error } = useEmployees();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>
            Error al cargar empleadas
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalAdmins = (employees ?? []).filter(e => e.role === 'admin').length;
  const totalEmployees = (employees ?? []).filter(e => e.role === 'employee').length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Empleadas</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <Pressable
                onPress={() => router.push('/invitation')}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  height: 36, borderRadius: 12, paddingHorizontal: 12,
                  backgroundColor: accent + '18', opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons name="mail-outline" size={16} color={accent} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: accent }}>Invitar</Text>
              </Pressable>
            )}
            {isAdmin && (
              <Pressable onPress={() => router.push('/employee/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add" size={22} color="#fff" />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Stats chips */}
      {(employees?.length ?? 0) > 0 && (
        <View style={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: accent + '18', borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Ionicons name="people" size={14} color={accent} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: accent }}>
              {employees?.length ?? 0} en total
            </Text>
          </View>
          {totalAdmins > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: colors.surface, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Ionicons name="shield-checkmark" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>
                {totalAdmins} admin{totalAdmins > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {totalEmployees > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: colors.surface, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Ionicons name="person" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>
                {totalEmployees} staff
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Lista */}
      {(employees?.length ?? 0) === 0 ? (
        <EmptyState colors={colors} accent={accent} isAdmin={isAdmin} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              colors={colors}
              accent={accent}
              onPress={() => router.push(`/employee/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => null}
        />
      )}
    </SafeAreaView>
  );
}
