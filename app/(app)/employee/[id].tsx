import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEmployeeById, useEmployeeStats } from '@/hooks/useEmployees';
import { useUpdateEmployee, useChangeEmployeeRole } from '@/hooks/useEmployeeMutations';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function StatCard({
  icon, label, value, accent, colors,
}: {
  icon: IoniconsName;
  label: string;
  value: string;
  accent: string;
  colors: any;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 16, padding: 14,
      alignItems: 'center', gap: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: accent + '18',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function InfoRow({
  icon, label, value, colors, accent,
}: {
  icon: IoniconsName;
  label: string;
  value: string;
  colors: any;
  accent: string;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    }}>
      <View style={{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: accent + '18',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function RoleToggle({
  currentRole,
  employeeId,
  selfId,
  colors,
  accent,
}: {
  currentRole: UserRole;
  employeeId: string;
  selfId: string;
  colors: any;
  accent: string;
}) {
  const changeRole = useChangeEmployeeRole();
  const isSelf = employeeId === selfId;

  if (isSelf) return null;

  const isAdmin = currentRole === 'admin';

  function handleToggle() {
    const newRole: UserRole = isAdmin ? 'employee' : 'admin';
    const label = isAdmin ? 'quitar permisos de admin' : 'dar permisos de admin';
    Alert.alert(
      'Cambiar rol',
      `¿Quieres ${label} a esta empleada?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await changeRole.mutateAsync({ id: employeeId, role: newRole });
            } catch {
              Alert.alert('Error', 'No se pudo cambiar el rol');
            }
          },
        },
      ],
    );
  }

  return (
    <Pressable
      onPress={handleToggle}
      disabled={changeRole.isPending}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12,
        opacity: pressed || changeRole.isPending ? 0.7 : 1,
      })}
    >
      <View style={{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: isAdmin ? '#FF453A18' : '#6EE7B720',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons
          name={isAdmin ? 'shield-outline' : 'shield-checkmark-outline'}
          size={16}
          color={isAdmin ? '#FF453A' : '#059669'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: isAdmin ? '#FF453A' : '#059669' }}>
          {isAdmin ? 'Quitar rol de admin' : 'Dar rol de admin'}
        </Text>
      </View>
      {changeRole.isPending && <ActivityIndicator size="small" color={accent} />}
    </Pressable>
  );
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const { data: employee, isLoading } = useEmployeeById(id);
  const { data: stats } = useEmployeeStats(id);
  const updateEmployee = useUpdateEmployee();

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [nameError, setNameError] = useState('');

  function startEdit() {
    setEditName(employee?.full_name ?? '');
    setEditPhone(employee?.phone ?? '');
    setNameError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setNameError('');
  }

  async function handleSave() {
    if (!editName.trim()) {
      setNameError('El nombre es requerido');
      return;
    }
    try {
      await updateEmployee.mutateAsync({
        id: id!,
        full_name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la empleada');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>Empleada no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSelf = employee.id === profile?.id;
  const roleLabel = employee.role === 'admin' ? 'Administradora' : 'Empleada';
  const roleColor = employee.role === 'admin' ? accent : '#059669';
  const roleBg = employee.role === 'admin' ? accent + '20' : '#6EE7B720';

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
            Empleada
          </Text>
        </Pressable>
        {isAdmin && (
          <Pressable
            onPress={editing ? cancelEdit : startEdit}
            style={({ pressed }) => ({
              paddingHorizontal: 14, paddingVertical: 7,
              borderRadius: 12,
              backgroundColor: editing ? colors.surface : accent + '18',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: editing ? colors.textSecondary : accent }}>
              {editing ? 'Cancelar' : 'Editar'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >

        {/* Hero card */}
        <View style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 24, padding: 20,
          alignItems: 'center', marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}>
          <Avatar
            name={employee.full_name}
            uri={employee.avatar_url ?? undefined}
            size="xl"
          />
          <View style={{ marginTop: 14, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
              {employee.full_name}
            </Text>
            <View style={{
              backgroundColor: roleBg, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: roleColor }}>
                {roleLabel}
              </Text>
            </View>
            {isSelf && (
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                (tú)
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <StatCard
              icon="calendar-outline"
              label="Citas este mes"
              value={String(stats.appointmentsThisMonth)}
              accent={accent}
              colors={colors}
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Completadas"
              value={String(stats.completedAppointments)}
              accent={accent}
              colors={colors}
            />
            <StatCard
              icon="cash-outline"
              label="Ingresos"
              value={formatCurrency(stats.totalRevenue)}
              accent={accent}
              colors={colors}
            />
          </View>
        )}

        {/* Información / Edición */}
        <View style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 20, padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 13, fontWeight: '600', color: colors.textSecondary,
            letterSpacing: 0.5, textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Información
          </Text>

          {editing ? (
            <View style={{ gap: 12 }}>
              <Input
                label="Nombre completo"
                value={editName}
                onChangeText={v => { setEditName(v); setNameError(''); }}
                error={nameError}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <Input
                label="Teléfono"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          ) : (
            <View>
              <InfoRow
                icon="person-outline"
                label="Nombre"
                value={employee.full_name}
                colors={colors}
                accent={accent}
              />
              <InfoRow
                icon="call-outline"
                label="Teléfono"
                value={employee.phone ?? 'Sin teléfono'}
                colors={colors}
                accent={accent}
              />
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingTop: 12,
              }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: accent + '18',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="time-outline" size={16} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                    Miembro desde
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>
                    {new Date(employee.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Botón guardar (solo en modo edición) */}
        {editing && (
          <Pressable
            onPress={handleSave}
            style={{ marginBottom: 16, backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
          >
            {updateEmployee.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        )}

        {/* Administración (solo admin, no a sí mismo) */}
        {isAdmin && !isSelf && (
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20, padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{
              fontSize: 13, fontWeight: '600', color: colors.textSecondary,
              letterSpacing: 0.5, textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Administración
            </Text>

            <RoleToggle
              currentRole={employee.role}
              employeeId={employee.id}
              selfId={profile?.id ?? ''}
              colors={colors}
              accent={accent}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
