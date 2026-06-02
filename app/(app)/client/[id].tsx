import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Alert, TextInput, KeyboardAvoidingView, Platform, Modal as RNModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useTheme } from '@/hooks/useTheme';
import { useUpdateClient, useDeleteClient } from '@/hooks/useClientMutations';
import type { AppointmentStatus } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  no_show_count: number;
  created_at: string;
}

interface ClientAppointment {
  id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  payment_status: 'pending' | 'paid';
  services: { name: string; price_snapshot: number }[];
  total: number;
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
  cancelled: '#8E8E93',
  no_show:   '#FF453A',
};

const AVATAR_COLORS = [
  '#F4A99A', '#C4B5FD', '#FDA4AF', '#6EE7B7', '#7DD3FC', '#FDBA74',
  '#A78BFA', '#34D399', '#60A5FA', '#FB923C',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash)];
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function parseBirthdate(value: string) {
  if (!value) return new Date(2000, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(2000, 0, 1);
  return new Date(year, month - 1, day);
}

function formatBirthdateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBirthdateDisplay(value: string) {
  if (!value) return '';
  const date = parseBirthdate(value);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// ─── Inline editable field ────────────────────────────────────────────────────

function EditableRow({
  icon, label, value, onChange, placeholder, keyboardType, editing, accent, colors, last, onPress, suffixIcon,
}: {
  icon: string; label: string; value: string; onChange: (v: string) => void;
  placeholder: string; keyboardType?: any; editing: boolean;
  accent: string; colors: any; last?: boolean;
  onPress?: () => void;
  suffixIcon?: string;
}) {
  const content = (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: accent + '16',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={16} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
        {editing ? (
          onPress ? (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: value ? colors.text : colors.textSecondary + '80',
              }}>
                {value || placeholder}
              </Text>
              {suffixIcon && (
                <Ionicons name={suffixIcon as any} size={16} color={colors.textSecondary} />
              )}
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 2,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.text,
                  paddingVertical: 8,
                }}
              />
            </View>
          )
        ) : (
          <Text style={{ fontSize: 14, color: value ? colors.text : colors.textSecondary + '80' }}>
            {value || placeholder}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();

  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes]         = useState('');
  const [birthdatePickerOpen, setBirthdatePickerOpen] = useState(false);

  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<ClientDetail>(
        `SELECT id, name, phone, email, birthdate, notes, no_show_count, created_at
         FROM clients WHERE id = ? AND _deleted = 0`,
        [id]
      );
      if (!row) throw new Error('Cliente no encontrado');
      return row;
    },
    enabled: !!id,
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['client-appointments', id],
    queryFn: async () => {
      const db = getDb();
      const appts = await db.getAllAsync<{
        id: string; scheduled_at: string; status: string; payment_status: string;
      }>(
        `SELECT id, scheduled_at, status, payment_status
         FROM appointments
         WHERE client_id = ? AND _deleted = 0
         ORDER BY scheduled_at DESC`,
        [id]
      );

      const result = [];
      for (const a of appts) {
        const svcs = await db.getAllAsync<{ name: string; price_snapshot: number }>(
          `SELECT COALESCE(s.name, '—') AS name, as_.price_snapshot
           FROM appointment_services as_
           LEFT JOIN services s ON s.id = as_.service_id
           WHERE as_.appointment_id = ?`,
          [a.id]
        );
        result.push({
          id: a.id,
          scheduled_at: a.scheduled_at,
          status: a.status,
          payment_status: a.payment_status,
        });
      }
      return result as ClientAppointment[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!client) return;
    setName(client.name);
    setPhone(client.phone ?? '');
    setEmail(client.email ?? '');
    setBirthdate(client.birthdate ?? '');
    setNotes(client.notes ?? '');
  }, [client]);

  async function handleSave() {
    if (!client || name.trim().length < 2) return;
    try {
      await updateClient.mutateAsync({
        id: client.id,
        name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        birthdate: birthdate || undefined,
        notes: notes || undefined,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar clienta',
      `¿Segura que deseas eliminar a ${client?.name}?\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient.mutateAsync(id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar la clienta');
            }
          },
        },
      ]
    );
  }

  if (loadingClient) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} size="large" />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Clienta no encontrada</Text>
      </SafeAreaView>
    );
  }

  const bgColor = avatarColor(client.name);
  const completedAppts = appointments.filter((a) => a.status === 'completed');
  const totalSpent = completedAppts.reduce((sum, a) => sum + a.total, 0);
  const isValid = name.trim().length >= 2;
  const isDirty =
    name !== client.name ||
    phone !== (client.phone ?? '') ||
    email !== (client.email ?? '') ||
    birthdate !== (client.birthdate ?? '') ||
    notes !== (client.notes ?? '');

  function openBirthdatePicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseBirthdate(birthdate),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setBirthdate(formatBirthdateInput(selectedDate));
          }
        },
      });
      return;
    }

    setBirthdatePickerOpen(true);
  }

  function handleBirthdateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (selectedDate) {
      setBirthdate(formatBirthdateInput(selectedDate));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 8,
          })}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <Text style={{
          flex: 1,
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
        }} numberOfLines={1}>
          Clienta
        </Text>

        <Pressable
          onPress={confirmDelete}
          hitSlop={12}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 8,
          })}
        >
          <Ionicons name="trash-outline" size={20} color="#FF453A" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar + nombre ── */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: bgColor + '30',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: bgColor }}>
                {getInitials(name || client.name)}
              </Text>
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre completo"
              placeholderTextColor={colors.textSecondary + '80'}
              autoCapitalize="words"
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                paddingBottom: 4,
                minWidth: 180,
              }}
            />

            {client.no_show_count > 0 && (
              <View style={{
                backgroundColor: '#FF453A22', borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF453A' }}>
                  {client.no_show_count} falta{client.no_show_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* ── Stats ── */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <StatCard
              label="Visitas"
              value={String(completedAppts.length)}
              icon="calendar-outline"
              colors={colors}
              accent={accent}
            />
            <StatCard
              label="Total gastado"
              value={formatCurrency(totalSpent)}
              icon="cash-outline"
              colors={colors}
              accent={accent}
            />
            {appointments.length > 0 && (
              <StatCard
                label="Última visita"
                value={formatDate(appointments[0].scheduled_at)}
                icon="time-outline"
                colors={colors}
                accent={accent}
              />
            )}
          </View>

          {/* ── Contacto ── */}
          <SectionLabel label="Contacto" colors={colors} />
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <EditableRow
              icon="call-outline"
              label="Teléfono"
              value={phone}
              onChange={setPhone}
              placeholder="Sin teléfono"
              keyboardType="phone-pad"
              editing
              accent={accent}
              colors={colors}
            />
            <EditableRow
              icon="mail-outline"
              label="Correo"
              value={email}
              onChange={setEmail}
              placeholder="Sin correo"
              keyboardType="email-address"
              editing
              accent={accent}
              colors={colors}
            />
            <EditableRow
              icon="gift-outline"
              label="Cumpleaños"
              value={formatBirthdateDisplay(birthdate)}
              onChange={() => {}}
              placeholder="Seleccionar fecha"
              onPress={openBirthdatePicker}
              suffixIcon="calendar-outline"
              editing
              accent={accent}
              colors={colors}
            />
          </View>

          {/* ── Notas ── */}
          <SectionLabel label="Notas" colors={colors} />
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Preferencias, alergias, notas..."
              placeholderTextColor={colors.textSecondary + '80'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                fontSize: 14,
                color: colors.text,
                lineHeight: 20,
                minHeight: 80,
              }}
            />
          </View>

          <SectionLabel label={`Historial (${appointments.length})`} colors={colors} />
          {loadingAppts ? (
            <ActivityIndicator color={accent} style={{ marginTop: 12 }} />
          ) : appointments.length === 0 ? (
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 20,
              padding: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Sin citas registradas</Text>
            </View>
          ) : (
            <View>
              {appointments.map((appt) => (
                <AppointmentRow
                  key={appt.id}
                  appt={appt}
                  colors={colors}
                  onPress={() => router.push(`/appointment/${appt.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {isDirty && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
          backgroundColor: colors.background,
          borderTopWidth: 1, borderTopColor: colors.border,
        }}>
          <Pressable
            onPress={handleSave}
            disabled={!isValid || updateClient.isPending}
            style={{
              backgroundColor: accent,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              opacity: !isValid || updateClient.isPending ? 0.5 : 1,
            }}
          >
            {updateClient.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>}
          </Pressable>
          </View>
        )}

      {Platform.OS === 'ios' && birthdatePickerOpen && (
        <RNModal
          visible={birthdatePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setBirthdatePickerOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
            onPress={() => setBirthdatePickerOpen(false)}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 24,
              }}>
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                </View>
                <View style={{ paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="calendar-outline" size={17} color={accent} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      Cumpleaños
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setBirthdatePickerOpen(false)}
                    hitSlop={12}
                    style={({ pressed }) => ({
                      position: 'absolute',
                      right: 20, top: 14,
                      backgroundColor: accent,
                      borderRadius: 10,
                      paddingHorizontal: 18,
                      paddingVertical: 8,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Listo</Text>
                  </Pressable>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20 }} />
                <DateTimePicker
                  value={parseBirthdate(birthdate)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleBirthdateChange}
                  accentColor={accent}
                  textColor={colors.text}
                  themeVariant={colors.background === '#000000' ? 'dark' : 'light'}
                />
              </View>
            </Pressable>
          </Pressable>
        </RNModal>
      )}

    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase',
      marginTop: 20, marginBottom: 10,
    }}>
      {label}
    </Text>
  );
}

function StatCard({ label, value, icon, colors, accent }: {
  label: string; value: string; icon: string; colors: any; accent: string;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 20,
      padding: 16,
      alignItems: 'center',
      gap: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}>
      <Ionicons name={icon as any} size={20} color={accent} />
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

function AppointmentRow({
  appt, colors, onPress,
}: {
  appt: ClientAppointment; colors: any; onPress: () => void;
}) {
  const statusColor = STATUS_COLOR[appt.status] ?? '#8E8E93';
  const statusLabel = STATUS_LABEL[appt.status] ?? appt.status;
  const serviceNames = appt.services.map((s) => s.name).join(', ') || 'Sin servicios';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginBottom: 24 })}
    >
      <View style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}>
        <View style={{ width: 4, height: 44, borderRadius: 2, backgroundColor: statusColor }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {serviceNames}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {formatDate(appt.scheduled_at)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {appt.total > 0 ? formatCurrency(appt.total) : '—'}
          </Text>
          <View style={{
            backgroundColor: statusColor + '22', borderRadius: 6,
            paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
