import {
  View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Platform, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { useBusinessConfig, useUpdateBusinessConfig } from '@/hooks/useBusinessConfig';
import type { BusinessConfig } from '@/hooks/useBusinessConfig';
import { useLogoUpload } from '@/hooks/useLogoUpload';

const DAY_LABELS: { short: string; abbr: string }[] = [
  { short: 'Domingo',    abbr: 'Do' },
  { short: 'Lunes',      abbr: 'Lu' },
  { short: 'Martes',     abbr: 'Ma' },
  { short: 'Miércoles',  abbr: 'Mi' },
  { short: 'Jueves',     abbr: 'Ju' },
  { short: 'Viernes',    abbr: 'Vi' },
  { short: 'Sábado',     abbr: 'Sá' },
];

function timeStringToDate(value: string): Date {
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTimeLabel(value: string): string {
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' })
    .format(timeStringToDate(value));
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 4,
    }}>
      {label}
    </Text>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, colors, accent,
  keyboardType = 'default', prefix,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; colors: any; accent: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: focused ? accent : colors.border,
        borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 12,
      }}>
        {prefix && <Text style={{ fontSize: 14, color: colors.textSecondary, marginRight: 4 }}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? ''}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
        />
      </View>
    </View>
  );
}


// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminConfigScreen() {
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const { org, orgRole } = useActiveOrg();
  const { notificationLeadMinutes, setNotificationLeadMinutes } = usePreferencesStore();
  const { data: remoteConfig, isLoading } = useBusinessConfig();
  const updateMutation = useUpdateBusinessConfig();
  const { pickAndUpload, removeLogo, isUploading } = useLogoUpload();

  const [form, setForm] = useState<Pick<BusinessConfig, 'open_time' | 'close_time' | 'work_days' | 'currency' | 'off_hours_surcharge' | 'off_hours_surcharge_type'>>({
    open_time: '09:00', close_time: '18:00',
    work_days: [1, 2, 3, 4, 5, 6],
    currency: 'MXN', off_hours_surcharge: 0, off_hours_surcharge_type: 'fixed',
  });
  const [dirty, setDirty] = useState(false);
  // null = closed, 'open' = apertura visible, 'close' = cierre visible
  const [activePicker, setActivePicker] = useState<'open' | 'close' | null>(null);

  if (orgRole !== 'admin' && orgRole !== 'owner') return <Redirect href="/(app)/(tabs)" />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (remoteConfig) {
      setForm({
        open_time: remoteConfig.open_time,
        close_time: remoteConfig.close_time,
        work_days: remoteConfig.work_days,
        currency: remoteConfig.currency,
        off_hours_surcharge: remoteConfig.off_hours_surcharge,
        off_hours_surcharge_type: remoteConfig.off_hours_surcharge_type ?? 'fixed',
      });
      setDirty(false);
    }
  }, [remoteConfig]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function toggleDay(day: number) {
    const next = form.work_days.includes(day)
      ? form.work_days.filter(d => d !== day)
      : [...form.work_days, day].sort((a, b) => a - b);
    update('work_days', next);
  }

  async function handleSave() {
    if (form.work_days.length === 0) {
      Alert.alert('Falta un dato', 'Selecciona al menos un día laboral.');
      return;
    }
    try {
      await updateMutation.mutateAsync(form);
      setDirty(false);
      Alert.alert('Guardado', 'Configuración guardada correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar.');
    }
  }

  const notifOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '1 día', value: 1440 },
  ];

  function handlePickerPress(target: 'open' | 'close') {
    if (Platform.OS === 'android') {
      // En Android abrimos el dialog nativo directamente
      DateTimePickerAndroid.open({
        value: timeStringToDate(target === 'open' ? form.open_time : form.close_time),
        mode: 'time',
        is24Hour: false,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            update(target === 'open' ? 'open_time' : 'close_time', dateToTimeString(selectedDate));
          }
        },
      });
      return;
    }
    // iOS: toggle — si ya está abierto el mismo lo cerramos, si es diferente lo cambiamos
    setActivePicker(prev => (prev === target ? null : target));
  }

  function handleIOSTimeChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (selectedDate && activePicker) {
      update(activePicker === 'open' ? 'open_time' : 'close_time', dateToTimeString(selectedDate));
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flex: 1 })}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Horario y preferencias</Text>
        </Pressable>
        {dirty && (
          <Pressable
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={({ pressed }) => ({
              backgroundColor: accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
              opacity: pressed || updateMutation.isPending ? 0.7 : 1,
            })}
          >
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Guardar</Text>
            }
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>

        {/* ── Logo del salón ── */}
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <SectionTitle label="Logo del salón" colors={colors} />
          <View style={{
            backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 20,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            alignItems: 'center', gap: 16,
          }}>
            <View style={{
              width: 100, height: 100, borderRadius: 24,
              backgroundColor: colors.surface,
              borderWidth: 2, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {org?.logo_url ? (
                <Image source={{ uri: org.logo_url }} style={{ width: 100, height: 100 }} resizeMode="cover" />
              ) : (
                <Ionicons name="sparkles" size={38} color={accent} />
              )}
              {isUploading && (
                <View style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
              {org?.logo_url ? 'Logo actual del salón' : 'Sin logo — se mostrará un ícono genérico'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={async () => {
                  const url = await pickAndUpload();
                  if (url) Alert.alert('Listo', 'Logo actualizado correctamente.');
                }}
                disabled={isUploading}
                style={({ pressed }) => ({
                  flex: 1, height: 42, borderRadius: 12,
                  backgroundColor: accent, alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 6,
                  opacity: pressed || isUploading ? 0.7 : 1,
                })}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                  {org?.logo_url ? 'Cambiar' : 'Subir logo'}
                </Text>
              </Pressable>

              {org?.logo_url && (
                <Pressable
                  onPress={() => {
                    Alert.alert('Eliminar logo', '¿Quitar el logo del salón?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => removeLogo() },
                    ]);
                  }}
                  disabled={isUploading}
                  style={({ pressed }) => ({
                    height: 42, paddingHorizontal: 16, borderRadius: 12,
                    borderWidth: 1.5, borderColor: '#FF453A',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed || isUploading ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="trash-outline" size={17} color="#FF453A" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* ── Horario de atención ── */}
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <SectionTitle label="Horario de atención" colors={colors} />
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>

            {/* ── Apertura / Cierre — 2 columnas 50/50 ── */}
            <View style={{
              flexDirection: 'row',
              marginBottom: 24,
              backgroundColor: 'transparent',
            }}>
              <View style={{ width: '50%' }}>
                <Pressable
                  onPress={() => handlePickerPress('open')}
                  style={({ pressed }) => ({
                    width: '100%',
                    minHeight: 84,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 14,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 6 }}>
                    <Ionicons name="sunny-outline" size={13} color={colors.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }}>
                      Apertura
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                    {formatTimeLabel(form.open_time)}
                  </Text>
                </Pressable>
              </View>

              <View style={{ width: '50%' }}>
                <Pressable
                  onPress={() => handlePickerPress('close')}
                  style={({ pressed }) => ({
                    width: '100%',
                    minHeight: 84,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 14,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 6 }}>
                    <Ionicons name="moon-outline" size={13} color={colors.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }}>
                      Cierre
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                    {formatTimeLabel(form.close_time)}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ── Separador ── */}
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />

            {/* ── Días laborales ── */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Días laborales
            </Text>
            <View style={{ flexDirection: 'row', gap: 5, marginHorizontal: -20, paddingHorizontal: 20 }}>
              {DAY_LABELS.map((day, index) => {
                const active = form.work_days.includes(index);
                return (
                  <View
                    key={day.abbr}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: active ? accent : '#E8E8E8',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Pressable
                      onPress={() => toggleDay(index)}
                      style={({ pressed }) => ({
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? '#fff' : '#888888',
                      }}>
                        {day.abbr}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Modal picker de hora (iOS) ── */}
        {Platform.OS === 'ios' && (
          <Modal
            visible={activePicker !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setActivePicker(null)}
          >
            <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
              onPress={() => setActivePicker(null)}
            >
              {/* Evitar que el tap en el sheet cierre el modal */}
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={{
                  backgroundColor: colors.surfaceElevated,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingBottom: 34,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 20,
                }}>
                  {/* Handle */}
                  <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                  </View>

                  {/* Título + botón Listo */}
                  <View style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}>
                    {/* Título centrado */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons
                        name={activePicker === 'open' ? 'sunny-outline' : 'moon-outline'}
                        size={17}
                        color={accent}
                      />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                        {activePicker === 'open' ? 'Hora de apertura' : 'Hora de cierre'}
                      </Text>
                    </View>
                    {/* Botón Listo absoluto a la derecha */}
                    <Pressable
                      onPress={() => setActivePicker(null)}
                      hitSlop={12}
                      style={({ pressed }) => ({
                        position: 'absolute',
                        right: 20,
                        top: 14,
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

                  {/* Separador */}
                  <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20 }} />

                  {/* Picker */}
                  {activePicker !== null && (
                    <View style={{ alignItems: 'center' }}>
                      <DateTimePicker
                        key={activePicker}
                        value={timeStringToDate(activePicker === 'open' ? form.open_time : form.close_time)}
                        mode="time"
                        display="spinner"
                        onChange={handleIOSTimeChange}
                        accentColor={accent}
                        textColor={colors.text}
                        themeVariant={colors.background === '#000000' ? 'dark' : 'light'}
                        style={{ height: 200 }}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        )}

        {/* ── Moneda ── */}
        <View style={{ marginBottom: 24 }}>
          <SectionTitle label="Moneda" colors={colors} />
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
            <View style={{ flexDirection: 'row' }}>
              {([
                { code: 'MXN', name: 'Peso mexicano' },
                { code: 'USD', name: 'Dólar USD' },
              ] as const).map(currency => {
                const selected = form.currency === currency.code;
                return (
                  <View key={currency.code} style={{ width: '50%' }}>
                    <Pressable
                      onPress={() => update('currency', currency.code)}
                      style={({ pressed }) => ({
                        width: '100%',
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: selected ? accent : colors.border,
                        backgroundColor: selected ? accent + '30' : colors.surface,
                        minHeight: 72,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        opacity: pressed ? 0.78 : 1,
                      })}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: selected ? accent : colors.text,
                        marginBottom: 3,
                        textAlign: 'center',
                      }}>
                        {currency.code}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        color: selected ? accent : colors.textSecondary,
                        textAlign: 'center',
                      }}>
                        {currency.name}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Recargo fuera de horario ── */}
        <View style={{ marginBottom: 24 }}>
          <SectionTitle label="Recargo fuera de horario" colors={colors} />
          <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>

            {/* Tipo de recargo */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
              Tipo de recargo
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {([
                { value: 'fixed', label: 'Monto fijo', desc: 'Ej. $50' },
                { value: 'percent', label: 'Porcentaje', desc: 'Ej. 20%' },
              ] as const).map(opt => {
                const selected = form.off_hours_surcharge_type === opt.value;
                return (
                  <View key={opt.value} style={{ width: '50%' }}>
                    <Pressable
                      onPress={() => update('off_hours_surcharge_type', opt.value)}
                      style={({ pressed }) => ({
                        width: '100%',
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: selected ? accent : colors.border,
                        backgroundColor: selected ? accent + '20' : colors.surface,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        alignItems: 'center',
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? accent : colors.text, marginBottom: 2, textAlign: 'center' }}>
                        {opt.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: selected ? accent : colors.textSecondary, textAlign: 'center' }}>
                        {opt.desc}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Valor del recargo */}
            <Field
              label={form.off_hours_surcharge_type === 'percent' ? 'Porcentaje de recargo' : 'Monto fijo de recargo'}
              value={String(form.off_hours_surcharge)}
              onChangeText={v => update('off_hours_surcharge', parseFloat(v) || 0)}
              placeholder="0"
              keyboardType="numeric"
              colors={colors}
              accent={accent}
              prefix={form.off_hours_surcharge_type === 'percent' ? '%' : '$'}
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -8 }}>
              {form.off_hours_surcharge_type === 'percent'
                ? 'Se aplica sobre el precio del servicio. Pon 0 para no cobrar recargo.'
                : 'Se suma al total de la cita. Pon 0 para no cobrar recargo.'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 8, fontStyle: 'italic' }}>
              Solo aplica a servicios que tengan activado el recargo fuera de horario.
            </Text>
          </View>
        </View>

        {/* ── Recordatorios ── */}
        <View style={{ marginBottom: 24 }}>
          <SectionTitle label="Recordatorios" colors={colors} />
          <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Anticipación del recordatorio</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 12 }}>
              Cuánto tiempo antes de la cita se envía el aviso
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {notifOptions.map(opt => {
                const selected = opt.value === notificationLeadMinutes;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setNotificationLeadMinutes(opt.value)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: selected ? accent + '30' : colors.surface,
                      borderWidth: 1.5, borderColor: selected ? accent : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? accent : colors.text }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textTertiary, marginTop: 8 }}>
          Coraline Nails v1.0.0
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
