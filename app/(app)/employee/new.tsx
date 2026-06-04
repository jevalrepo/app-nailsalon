import {
  View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateEmployee } from '@/hooks/useEmployeeMutations';
import { useSyncContext } from '@/lib/sync/SyncProvider';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function RoleSelector({
  value,
  onChange,
  colors,
  accent,
  isOwner,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
  colors: any;
  accent: string;
  isOwner: boolean;
}) {
  const allOptions: { role: UserRole; label: string; desc: string; icon: IoniconsName }[] = [
    {
      role: 'employee',
      label: 'Empleada',
      desc: 'Puede ver sus citas y gestionar clientes',
      icon: 'person-outline',
    },
    {
      role: 'admin',
      label: 'Administradora',
      desc: 'Acceso completo a todas las funciones',
      icon: 'shield-checkmark-outline',
    },
  ];
  const options = isOwner ? allOptions : allOptions.filter(o => o.role === 'employee');

  return (
    <View style={{ gap: 10 }}>
      {options.map(opt => {
        const selected = value === opt.role;
        return (
          <Pressable
            key={opt.role}
            onPress={() => onChange(opt.role)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: selected ? accent : colors.border,
              backgroundColor: selected ? accent + '10' : colors.surfaceElevated,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: selected ? accent + '22' : colors.surface,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={selected ? accent : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15, fontWeight: '600',
                  color: selected ? accent : colors.text,
                }}>
                  {opt.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {opt.desc}
                </Text>
              </View>
              {selected && (
                <Ionicons name="checkmark-circle" size={22} color={accent} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function NewEmployeeScreen() {
  const { colors, accent } = useTheme();
  const createEmployee = useCreateEmployee();
  const { isConnected } = useSyncContext();
  const { orgRole } = useActiveOrg();
  const isOwner = orgRole === 'owner';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'El nombre es requerido';
    if (!email.trim()) newErrors.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Correo no válido';
    if (!password.trim()) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;

    try {
      await createEmployee.mutateAsync({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        phone: phone.trim() || undefined,
      });

      Alert.alert(
        'Empleada creada',
        `${fullName.trim()} ya puede iniciar sesión con su correo y contraseña.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert(
        'Error al crear empleada',
        err?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Nueva empleada</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >

          {/* Info personal */}
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
              Información personal
            </Text>

            <Input
              label="Nombre completo"
              placeholder="Ej: Ana García"
              value={fullName}
              onChangeText={v => { setFullName(v); if (errors.fullName) setErrors(p => ({ ...p, fullName: '' })); }}
              error={errors.fullName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <View style={{ height: 12 }} />

            <Input
              label="Teléfono"
              placeholder="Ej: 5512345678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Acceso */}
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
              Acceso a la app
            </Text>

            <Input
              label="Correo electrónico"
              placeholder="empleada@correo.com"
              value={email}
              onChangeText={v => { setEmail(v); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <View style={{ height: 12 }} />

            <Input
              label="Contraseña temporal"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={v => { setPassword(v); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
              error={errors.password}
              isPassword
              returnKeyType="done"
            />

            {/* Tip */}
            <View style={{
              flexDirection: 'row', gap: 8, alignItems: 'flex-start',
              backgroundColor: accent + '12', borderRadius: 12,
              padding: 12, marginTop: 14,
            }}>
              <Ionicons name="information-circle" size={16} color={accent} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: accent, lineHeight: 18 }}>
                La empleada usará este correo y contraseña para iniciar sesión. Puedes pedirle que cambie su contraseña después.
              </Text>
            </View>
          </View>

          {/* Rol */}
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20, padding: 16,
            marginBottom: 24,
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
              Rol y permisos
            </Text>

            <RoleSelector
              value={role}
              onChange={setRole}
              colors={colors}
              accent={accent}
              isOwner={isOwner}
            />
            {!isOwner && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
                Solo el propietario puede crear administradoras.
              </Text>
            )}
          </View>

        </ScrollView>

        {/* Botón fijo */}
        {(() => {
          const dirty = fullName.trim().length > 0 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
            password.length >= 6;
          return (
            <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
              {!isConnected && (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 8, fontSize: 12 }}>
                  Se requiere conexión a internet para crear empleadas
                </Text>
              )}
              <Pressable
                onPress={handleCreate}
                disabled={!dirty || createEmployee.isPending}
                style={{
                  marginTop: 8,
                  backgroundColor: dirty ? '#F4A99A' : colors.border,
                  borderRadius: 16, paddingVertical: 18, alignItems: 'center',
                }}
              >
                {createEmployee.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: dirty ? '#fff' : colors.textSecondary, fontSize: 17, fontWeight: '700' }}>Guardar</Text>
                }
              </Pressable>
            </View>
          );
        })()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
