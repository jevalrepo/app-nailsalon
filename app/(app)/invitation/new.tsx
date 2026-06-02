import { useState } from 'react';
import {
  View, Text, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCreateInvitation } from '@/hooks/useInvitationMutations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { InvitationRole } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const ROLE_OPTIONS: Array<{
  value: InvitationRole;
  label: string;
  description: string;
  icon: IoniconsName;
}> = [
  {
    value: 'employee',
    label: 'Empleada',
    description: 'Puede ver y gestionar sus propias citas.',
    icon: 'person-outline',
  },
  {
    value: 'admin',
    label: 'Administradora',
    description: 'Acceso completo: clientes, finanzas, configuración.',
    icon: 'shield-checkmark-outline',
  },
];

function RoleCard({
  option, selected, onSelect, colors, accent,
}: {
  option: typeof ROLE_OPTIONS[number];
  selected: boolean;
  onSelect: () => void;
  colors: any;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: selected ? accent : colors.borderLight,
        backgroundColor: selected ? accent + '0A' : colors.surfaceElevated,
        opacity: pressed ? 0.8 : 1,
        marginBottom: 10,
      })}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: selected ? accent + '25' : colors.surface,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={option.icon} size={20} color={selected ? accent : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15, fontWeight: '600',
          color: selected ? accent : colors.text,
        }}>
          {option.label}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
          {option.description}
        </Text>
      </View>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? accent : colors.borderLight,
        backgroundColor: selected ? accent : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
    </Pressable>
  );
}

function InfoBanner({ colors }: { colors: any }) {
  return (
    <View style={{
      flexDirection: 'row',
      gap: 10,
      padding: 14,
      backgroundColor: '#3B82F618',
      borderRadius: 14,
      marginBottom: 24,
    }}>
      <Ionicons name="information-circle-outline" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
        Se generará un enlace de invitación válido por 7 días. La persona deberá registrarse con el correo indicado para unirse al equipo.
      </Text>
    </View>
  );
}

export default function NewInvitationScreen() {
  const { colors, accent } = useTheme();
  const createMutation = useCreateInvitation();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState<InvitationRole>('employee');

  function validateEmail(value: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('El correo es obligatorio.');
      return false;
    }
    if (!re.test(value.trim())) {
      setEmailError('Ingresa un correo válido.');
      return false;
    }
    setEmailError('');
    return true;
  }

  function handleSend() {
    if (!validateEmail(email)) return;

    createMutation.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          Alert.alert(
            'Invitación enviada',
            `Se generó la invitación para ${email.trim()}. Comparte el enlace con ella para que pueda unirse.`,
            [{ text: 'Listo', onPress: () => router.back() }],
          );
        },
        onError: (err: any) => {
          const msg = err.message ?? 'No se pudo crear la invitación.';
          Alert.alert('Error', msg);
        },
      },
    );
  }

  const canSubmit = email.trim().length > 0 && !createMutation.isPending;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 12,
        }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: colors.text }}>
            Nueva invitación
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
        >
          <InfoBanner colors={colors} />

          {/* Email */}
          <Text style={{
            fontSize: 13, fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}>
            Correo electrónico
          </Text>
          <Input
            placeholder="nombre@ejemplo.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (emailError) validateEmail(v);
            }}
            onBlur={() => validateEmail(email)}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Role */}
          <Text style={{
            fontSize: 13, fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
            marginTop: 24,
          }}>
            Rol en el equipo
          </Text>
          {ROLE_OPTIONS.map((opt) => (
            <RoleCard
              key={opt.value}
              option={opt}
              selected={role === opt.value}
              onSelect={() => setRole(opt.value)}
              colors={colors}
              accent={accent}
            />
          ))}

          {/* CTA */}
          <View style={{ marginTop: 32 }}>
            <Button
              label={createMutation.isPending ? 'Enviando...' : 'Enviar invitación'}
              onPress={handleSend}
              disabled={!canSubmit}
              loading={createMutation.isPending}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
