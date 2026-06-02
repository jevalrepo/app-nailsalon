import {
  View, Text, Pressable, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useInvitations, isPending, isExpired, isAccepted } from '@/hooks/useInvitations';
import { useCancelInvitation, useResendInvitation } from '@/hooks/useInvitationMutations';
import type { Invitation } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function statusConfig(inv: Invitation): {
  label: string;
  color: string;
  bg: string;
  icon: IoniconsName;
} {
  if (isAccepted(inv)) return { label: 'Aceptada',  color: '#059669', bg: '#6EE7B720', icon: 'checkmark-circle' };
  if (isExpired(inv))  return { label: 'Vencida',   color: '#9CA3AF', bg: '#9CA3AF20', icon: 'time-outline' };
  return                      { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C720', icon: 'mail-outline' };
}

function roleLabel(role: string) {
  return role === 'admin' ? 'Administradora' : 'Empleada';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function InvitationCard({
  inv, colors, accent,
  onCancel, onResend,
}: {
  inv: Invitation;
  colors: any;
  accent: string;
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
}) {
  const status = statusConfig(inv);
  const pending = isPending(inv);
  const expired = isExpired(inv);
  const days = pending ? daysLeft(inv.expires_at) : null;

  return (
    <View style={{
      backgroundColor: colors.surfaceElevated,
      borderRadius: 20,
      padding: 16,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <View style={{
          width: 40, height: 40, borderRadius: 13,
          backgroundColor: status.bg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={status.icon} size={20} color={status.color} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {inv.email}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={{
              backgroundColor: accent + '18', borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>
                {roleLabel(inv.role)}
              </Text>
            </View>
            <View style={{
              backgroundColor: status.bg, borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: status.color }}>
                {status.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        marginTop: 12, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: colors.borderLight,
      }}>
        <Text style={{ flex: 1, fontSize: 12, color: colors.textTertiary }}>
          {isAccepted(inv)
            ? `Aceptada el ${formatDate(inv.accepted_at!)}`
            : pending && days !== null
              ? `Vence en ${days} día${days !== 1 ? 's' : ''}`
              : `Venció el ${formatDate(inv.expires_at)}`}
        </Text>

        {/* Actions */}
        {pending && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => onResend(inv.id)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: accent + '18', borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 5,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="refresh-outline" size={13} color={accent} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: accent }}>
                Reenviar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onCancel(inv.id)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: '#FF453A18', borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 5,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="close-outline" size={13} color="#FF453A" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF453A' }}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        )}

        {expired && (
          <Pressable
            onPress={() => onCancel(inv.id)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: '#FF453A18', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 5,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="trash-outline" size={13} color="#FF453A" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF453A' }}>
              Eliminar
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EmptyState({ colors, accent }: { colors: any; accent: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: accent + '18',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Ionicons name="mail-outline" size={34} color={accent} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
        Sin invitaciones
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
        Invita a tu equipo por correo para que puedan acceder al salón.
      </Text>
      <Pressable
        onPress={() => router.push('/invitation/new')}
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
          Enviar invitación
        </Text>
      </Pressable>
    </View>
  );
}

export default function InvitationListScreen() {
  const { colors, accent } = useTheme();
  const { data: invitations, isLoading } = useInvitations();
  const cancelMutation = useCancelInvitation();
  const resendMutation = useResendInvitation();

  function handleCancel(id: string) {
    Alert.alert(
      'Cancelar invitación',
      '¿Segura? Se eliminará la invitación y el enlace dejará de funcionar.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar', style: 'destructive',
          onPress: () => cancelMutation.mutate(id),
        },
      ],
    );
  }

  function handleResend(id: string) {
    resendMutation.mutate(id, {
      onSuccess: () => {
        Alert.alert('Invitación extendida', 'La invitación fue extendida 7 días más.');
      },
      onError: (err: any) => {
        Alert.alert('Error', err.message ?? 'No se pudo reenviar la invitación.');
      },
    });
  }

  const pending  = (invitations ?? []).filter(isPending);
  const accepted = (invitations ?? []).filter(isAccepted);
  const expired  = (invitations ?? []).filter(isExpired);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginRight: 12 })}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: colors.text }}>
          Invitaciones
        </Text>
        <Pressable
          onPress={() => router.push('/invitation/new')}
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

      {/* Chips */}
      {(invitations?.length ?? 0) > 0 && (
        <View style={{
          flexDirection: 'row', gap: 8,
          paddingHorizontal: 20, paddingBottom: 16,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: '#F59E0B20', borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Ionicons name="time-outline" size={13} color="#F59E0B" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#F59E0B' }}>
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {accepted.length > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: '#6EE7B720', borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Ionicons name="checkmark-circle-outline" size={13} color="#059669" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669' }}>
                {accepted.length} aceptada{accepted.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accent} />
        </View>
      ) : (invitations?.length ?? 0) === 0 ? (
        <EmptyState colors={colors} accent={accent} />
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <InvitationCard
              inv={item}
              colors={colors}
              accent={accent}
              onCancel={handleCancel}
              onResend={handleResend}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
