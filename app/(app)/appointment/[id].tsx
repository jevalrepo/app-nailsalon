import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useUpdateAppointment,
  useCancelAppointment,
  useMarkNoShow,
  useCompleteAppointment,
} from '@/hooks/useAppointmentMutations';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateTransaction } from '@/hooks/useFinanceMutations';
import type { AppointmentStatus } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppointmentDetail {
  id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  payment_status: 'pending' | 'paid';
  notes: string | null;
  client: { id: string; name: string; phone: string };
  employee: { id: string; full_name: string };
  services: { id: string; name: string; price_snapshot: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show:   'No llegó',
};

const STATUS_COLOR: Record<string, string> = {
  pending:   '#FF9F0A',
  confirmed: '#7DD3FC',
  completed: '#30D158',
  cancelled: '#FF453A',
  no_show:   '#A0A0A0',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

// ─── Fetch hook ───────────────────────────────────────────────────────────────

function useAppointmentDetail(id: string) {
  const { session } = useAuthStore();

  return useQuery({
    queryKey: ['appointment', id],
    enabled: !!session && !!id,
    queryFn: async () => {
      const db = getDb();

      const appt = await db.getFirstAsync<{
        id: string; scheduled_at: string; status: string;
        payment_status: string; notes: string | null;
        client_id: string; employee_id: string;
        client_name: string; client_phone: string | null;
        employee_name: string;
      }>(
        `SELECT a.id, a.scheduled_at, a.status, a.payment_status, a.notes,
                a.client_id, a.employee_id,
                COALESCE(c.name, '') AS client_name,
                c.phone AS client_phone,
                COALESCE(p.full_name, '') AS employee_name
         FROM appointments a
         LEFT JOIN clients c ON c.id = a.client_id
         LEFT JOIN profiles p ON p.id = a.employee_id
         WHERE a.id = ? AND a._deleted = 0`,
        [id]
      );

      if (!appt) throw new Error('Cita no encontrada');

      const services = await db.getAllAsync<{ id: string; name: string; price_snapshot: number }>(
        `SELECT as_.service_id AS id, COALESCE(s.name, 'Servicio') AS name, as_.price_snapshot
         FROM appointment_services as_
         LEFT JOIN services s ON s.id = as_.service_id
         WHERE as_.appointment_id = ?`,
        [id]
      );

      return {
        id: appt.id,
        scheduled_at: appt.scheduled_at,
        status: appt.status as AppointmentStatus,
        payment_status: appt.payment_status as 'pending' | 'paid',
        notes: appt.notes,
        client: { id: appt.client_id, name: appt.client_name, phone: appt.client_phone },
        employee: { id: appt.employee_id, full_name: appt.employee_name },
        services,
      } as AppointmentDetail;
    },
  });
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, colors, accent }: { icon: any; label: string; value: string; colors: any; accent: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: accent + '18',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500', marginTop: 1 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
  icon, label, color, onPress, disabled,
}: {
  icon: any; label: string; color: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ flex: 1, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    >
      <View style={{
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 14,
        backgroundColor: color + '18', gap: 4,
      }}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={{ fontSize: 11, fontWeight: '600', color, textAlign: 'center' }}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();

  const { data: appt, isLoading, error } = useAppointmentDetail(id ?? '');
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const noShowMutation = useMarkNoShow();
  const completeMutation = useCompleteAppointment();
  const createTransaction = useCreateTransaction();
  const { session } = useAuthStore();

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  const isMutating =
    updateMutation.isPending ||
    cancelMutation.isPending ||
    noShowMutation.isPending ||
    completeMutation.isPending;

  const isTerminal = appt?.status === 'cancelled' || appt?.status === 'completed';

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!appt) return;
    try {
      await updateMutation.mutateAsync({ id: appt.id, status: 'confirmed' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleComplete() {
    if (!appt) return;
    try {
      await completeMutation.mutateAsync({
        id: appt.id,
        paymentStatus: 'paid',
        paymentMethod,
      });
      setShowCompleteModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleCompleteNoPay() {
    if (!appt) return;
    try {
      await completeMutation.mutateAsync({
        id: appt.id,
        paymentStatus: 'pending',
        paymentMethod: 'cash',
      });
      setShowCompleteModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleMarkPaid() {
    if (!appt || !session) return;
    try {
      await updateMutation.mutateAsync({ id: appt.id, payment_status: 'paid' });
      // Crear transacción por el pago registrado desde el badge
      await createTransaction.mutateAsync({
        type: 'income',
        amount: totalPrice,
        description: `Servicio — ${appt.client?.name ?? 'Clienta'}`,
        category: 'Servicio',
        payment_method: paymentMethod,
        date: appt.scheduled_at.split('T')[0],
        appointment_id: appt.id,
        employee_id: appt.employee?.id ?? null,
      });
      setShowPaymentModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function handleCancel() {
    if (!appt) return;
    Alert.alert(
      'Cancelar cita',
      '¿Estás segura de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(appt.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }

  async function handleNoShow() {
    if (!appt) return;
    Alert.alert(
      'Marcar como no llegó',
      '¿Confirmas que la clienta no se presentó?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await noShowMutation.mutateAsync(appt.id);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }

  async function handleSaveNotes() {
    if (!appt) return;
    try {
      await updateMutation.mutateAsync({ id: appt.id, notes: editedNotes.trim() || undefined });
      setShowEditNotesModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} size="large" />
      </SafeAreaView>
    );
  }

  if (error || !appt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>No se pudo cargar la cita</Text>
        <Button label="Volver" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const { date, time } = formatDateTime(appt.scheduled_at);
  const totalPrice = appt.services.reduce((sum, s) => sum + s.price_snapshot, 0);
  const statusColor = STATUS_COLOR[appt.status] ?? '#A0A0A0';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: colors.text }}>
          Detalle de cita
        </Text>

        {/* Status badge */}
        <View style={{
          backgroundColor: statusColor + '22',
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor }}>
            {STATUS_LABEL[appt.status]}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={{
          backgroundColor: colors.surfaceElevated, borderRadius: 20,
          padding: 16, marginBottom: 16,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          <InfoRow icon="person" label="Cliente" value={appt.client?.name ?? '—'} colors={colors} accent={accent} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <InfoRow icon="person-circle" label="Empleada" value={appt.employee?.full_name ?? '—'} colors={colors} accent={accent} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <InfoRow icon="calendar" label="Fecha" value={date} colors={colors} accent={accent} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <InfoRow icon="time" label="Hora" value={time} colors={colors} accent={accent} />
        </View>

        {/* Services card */}
        <View style={{
          backgroundColor: colors.surfaceElevated, borderRadius: 20,
          padding: 16, marginBottom: 16,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Servicios
          </Text>
          {appt.services.map((svc) => (
            <View key={svc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>{svc.name}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                {formatCurrency(svc.price_snapshot)}
              </Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Total</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: accent }}>
              {formatCurrency(totalPrice)}
            </Text>
          </View>

          {/* Payment status */}
          <Pressable
            onPress={() => {
              if (appt.payment_status === 'paid' || isMutating) return;
              setShowPaymentModal(true);
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 10 })}
          >
            <View style={{
              backgroundColor: appt.payment_status === 'paid' ? '#30D15818' : '#FF9F0A18',
              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}>
              <Ionicons
                name={appt.payment_status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                size={16}
                color={appt.payment_status === 'paid' ? '#30D158' : '#FF9F0A'}
              />
              <Text style={{
                flex: 1, fontSize: 13, fontWeight: '600',
                color: appt.payment_status === 'paid' ? '#30D158' : '#FF9F0A',
              }}>
                {appt.payment_status === 'paid' ? 'Pagado' : 'Pago pendiente — toca para marcar'}
              </Text>
              {appt.payment_status === 'pending' && (
                <Ionicons name="chevron-forward" size={14} color="#FF9F0A" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Notes card */}
        <Pressable
          onPress={() => {
            if (isTerminal) return;
            setEditedNotes(appt.notes ?? '');
            setShowEditNotesModal(true);
          }}
          style={({ pressed }) => ({ opacity: !isTerminal && pressed ? 0.7 : 1, marginBottom: 20 })}
        >
          <View style={{
            backgroundColor: colors.surfaceElevated, borderRadius: 20,
            padding: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Notas
              </Text>
              {!isTerminal && (
                <Ionicons name="create-outline" size={16} color={accent} />
              )}
            </View>
            <Text style={{ fontSize: 14, color: appt.notes ? colors.text : colors.textTertiary, lineHeight: 20 }}>
              {appt.notes || 'Sin notas — toca para agregar'}
            </Text>
          </View>
        </Pressable>

        {/* Actions */}
        {!isTerminal && (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Acciones
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {appt.status === 'pending' && (
                <ActionButton
                  icon="checkmark-circle"
                  label="Confirmar"
                  color="#7DD3FC"
                  onPress={handleConfirm}
                  disabled={isMutating}
                />
              )}
              {(appt.status === 'pending' || appt.status === 'confirmed') && (
                <>
                  <ActionButton
                    icon="trophy"
                    label="Completar"
                    color="#30D158"
                    onPress={() => {
                      if (appt.payment_status === 'paid') {
                        // Ya pagó — completa directo sin preguntar
                        completeMutation.mutateAsync({ id: appt.id, paymentStatus: 'paid', paymentMethod: 'cash' })
                          .catch((e: any) => Alert.alert('Error', e.message));
                      } else {
                        setShowCompleteModal(true);
                      }
                    }}
                    disabled={isMutating}
                  />
                  <ActionButton
                    icon="person-remove"
                    label="No llegó"
                    color="#FF9F0A"
                    onPress={handleNoShow}
                    disabled={isMutating}
                  />
                  <ActionButton
                    icon="close-circle"
                    label="Cancelar"
                    color="#FF453A"
                    onPress={handleCancel}
                    disabled={isMutating}
                  />
                </>
              )}
            </View>
          </View>
        )}

        {isMutating && (
          <ActivityIndicator color={accent} style={{ marginTop: 16 }} />
        )}
      </ScrollView>

      {/* Complete modal — solo cuando payment_status es pending */}
      <Modal
        visible={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Completar cita"
      >
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
          ¿Cómo pagó la clienta?
        </Text>

        <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} accent={accent} colors={colors} />

        <Pressable
          onPress={handleComplete}
          style={{ backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 4 }}
        >
          {completeMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Completar y registrar pago</Text>
          }
        </Pressable>

        <Pressable
          onPress={handleCompleteNoPay}
          disabled={completeMutation.isPending}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: 'center', paddingVertical: 14 })}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Completar sin registrar pago</Text>
        </Pressable>
      </Modal>

      {/* Payment modal — marcar pago desde el badge */}
      <Modal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Registrar pago"
      >
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
          {formatCurrency(totalPrice)} — ¿cómo pagó la clienta?
        </Text>

        <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} accent={accent} colors={colors} />

        <Pressable
          onPress={handleMarkPaid}
          style={{ backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 4 }}
        >
          {updateMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Confirmar pago</Text>
          }
        </Pressable>
      </Modal>

      {/* Edit notes modal */}
      <Modal
        visible={showEditNotesModal}
        onClose={() => setShowEditNotesModal(false)}
        title="Editar notas"
      >
        <Input
          label="Notas"
          placeholder="Diseño solicitado, alergias, preferencias..."
          value={editedNotes}
          onChangeText={setEditedNotes}
          multiline
          numberOfLines={4}
          containerStyle={{ marginBottom: 16 }}
          style={{ height: 100, textAlignVertical: 'top' }}
        />
        <Button
          label="Guardar"
          onPress={handleSaveNotes}
          loading={updateMutation.isPending}
          fullWidth
        />
      </Modal>
    </SafeAreaView>
  );
}

function PaymentMethodSelector({ paymentMethod, setPaymentMethod, accent, colors }: {
  paymentMethod: 'cash' | 'card' | 'transfer';
  setPaymentMethod: (v: 'cash' | 'card' | 'transfer') => void;
  accent: string;
  colors: any;
}) {
  const options = [
    { value: 'cash'     as const, label: 'Efectivo',      icon: 'cash-outline'             as const },
    { value: 'card'     as const, label: 'Tarjeta',        icon: 'card-outline'             as const },
    { value: 'transfer' as const, label: 'Transferencia',  icon: 'swap-horizontal-outline'  as const },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {options.map((pm) => {
        const selected = paymentMethod === pm.value;
        return (
          <Pressable
            key={pm.value}
            onPress={() => setPaymentMethod(pm.value)}
            style={({ pressed }) => ({
              flex: 1, alignItems: 'center', gap: 4,
              paddingVertical: 12, borderRadius: 14,
              backgroundColor: selected ? accent + '20' : colors.surface,
              borderWidth: 1.5, borderColor: selected ? accent : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name={pm.icon} size={20} color={selected ? accent : colors.textSecondary} />
            <Text style={{ fontSize: 11, fontWeight: selected ? '700' : '500', color: selected ? accent : colors.textSecondary }}>
              {pm.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
