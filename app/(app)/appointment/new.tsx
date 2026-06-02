import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateAppointment } from '@/hooks/useAppointmentMutations';
import { useBookedSlots, type BookedSlot } from '@/hooks/useAppointments';
import { useBusinessConfig, isWithinWorkHours, isWorkDate } from '@/hooks/useBusinessConfig';
import { Input } from '@/components/ui/Input';
import type { Client, Service, Profile, ServiceCategory } from '@/types';

const CATEGORY_ICONS: Record<ServiceCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  manicure: 'color-palette-outline',
  pedicure: 'footsteps-outline',
  gel:      'sparkles-outline',
  acrilico: 'diamond-outline',
  otro:     'grid-outline',
};

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  manicure: '#F4A99A',
  pedicure: '#C4B5FD',
  gel:      '#6EE7B7',
  acrilico: '#7DD3FC',
  otro:     '#FDBA74',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function padTwo(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime12(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${padTwo(m)} ${period}`;
}

// Genera horas disponibles: 8:00 a 20:30 cada 30 min
function buildTimeSlots() {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${padTwo(h)}:00`);
    if (h < 20) slots.push(`${padTwo(h)}:30`);
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

// ─── SectionLabel ────────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 20, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {label}
    </Text>
  );
}

// ─── SelectRow ───────────────────────────────────────────────────────────────

function SelectRow({
  label,
  selected,
  onPress,
  accent,
  colors,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: string;
  colors: any;
  icon?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: selected ? accent + '12' : colors.surfaceElevated,
        borderRadius: 20, padding: 16,
        marginBottom: 8,
        borderWidth: 1.5, borderColor: selected ? accent : 'transparent',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          borderWidth: 1.5,
          borderColor: selected ? accent : colors.border,
          backgroundColor: selected ? accent : 'transparent',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
        }}>
          {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />}
        </View>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text }}>
          {label}
        </Text>
        {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
      </View>
    </Pressable>
  );
}

// ─── CheckRow (multi-select) ──────────────────────────────────────────────────

function CheckRow({
  label,
  sub,
  selected,
  onPress,
  accent,
  colors,
  category,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  accent: string;
  colors: any;
  category?: ServiceCategory;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: selected ? accent + '12' : colors.surfaceElevated,
        borderRadius: 20, padding: 16,
        marginBottom: 8,
        borderWidth: 1.5, borderColor: selected ? accent : 'transparent',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        <View style={{
          width: 24, height: 24, borderRadius: 7,
          borderWidth: 1.5,
          borderColor: selected ? accent : colors.border,
          backgroundColor: selected ? accent : 'transparent',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
        }}>
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {label}
          </Text>
          {sub ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{sub}</Text>
          ) : null}
        </View>
        {category && (
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: CATEGORY_COLORS[category] + '22',
            alignItems: 'center', justifyContent: 'center',
            marginLeft: 8,
          }}>
            <Ionicons name={CATEGORY_ICONS[category]} size={16} color={CATEGORY_COLORS[category]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── DatePicker mini ─────────────────────────────────────────────────────────

function buildWeekDays(offset: number, initialDate: string) {
  const days: Date[] = [];
  const base = new Date(`${initialDate}T12:00:00`);
  // Centro el día elegido: empieza 3 días antes
  base.setDate(base.getDate() - 3 + offset * 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function DatePickerInline({
  selected,
  onSelect,
  accent,
  colors,
  initialDate,
  workDays,
}: {
  selected: string;
  onSelect: (d: string) => void;
  accent: string;
  colors: any;
  initialDate: string;
  workDays?: number[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => buildWeekDays(weekOffset, initialDate), [weekOffset, initialDate]);
  const today = isoDate(new Date());

  const allPast = days.every(d => isoDate(d) < today);

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Pressable
          onPress={() => setWeekOffset(w => w - 1)}
          hitSlop={8}
          disabled={allPast}
          style={{ opacity: allPast ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
          {days[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => setWeekOffset(w => w + 1)} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((d) => {
          const key = isoDate(d);
          const isSelected = key === selected;
          const isToday = key === today;
          const isPast = key < today;
          const dow = d.getDay();
          const isOffDay = workDays ? !workDays.includes(dow) : false;

          return (
            <Pressable
              key={key}
              onPress={() => !isPast && onSelect(key)}
              disabled={isPast}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: isSelected ? accent : 'transparent',
                opacity: isPast ? 0.3 : 1,
                marginHorizontal: 2,
              }}
            >
              <Text style={{
                fontSize: 10, fontWeight: '500',
                color: isSelected ? '#fff' : colors.textTertiary,
                textTransform: 'capitalize',
              }}>
                {d.toLocaleDateString('es-MX', { weekday: 'narrow' })}
              </Text>
              <Text style={{
                fontSize: 16, fontWeight: '700', marginTop: 2,
                color: isSelected ? '#fff' : isToday ? accent : colors.text,
              }}>
                {d.getDate()}
              </Text>
              {/* Punto indicador de día fuera de horario */}
              {isOffDay && !isPast && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#FF9F0A',
                  marginTop: 2,
                }} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Time picker ─────────────────────────────────────────────────────────────

// Convierte 'HH:MM' a minutos desde medianoche
function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}

// Determina si un slot está bloqueado considerando duración de citas existentes
// y duración requerida por la nueva cita
function computeBlockedSlots(bookedSlots: BookedSlot[], newDurationMin: number): Set<string> {
  const blocked = new Set<string>();

  for (const slot of TIME_SLOTS) {
    const slotMin = slotToMinutes(slot);

    // 1. ¿Este slot cae dentro del rango de una cita existente?
    // Ej: cita 14:00 de 45 min → bloquea 14:00 y 14:30
    for (const booked of bookedSlots) {
      const bookedStart = slotToMinutes(booked.start_slot);
      const bookedEnd = bookedStart + booked.duration_min;
      if (slotMin >= bookedStart && slotMin < bookedEnd) {
        blocked.add(slot);
        break;
      }
    }
    if (blocked.has(slot)) continue;

    // 2. ¿La nueva cita iniciando aquí solaparía con una cita existente?
    // Ej: nueva cita de 60 min desde 13:30 termina 14:30 → choca con 14:00 → bloquear
    // Ej: nueva cita de 30 min desde 13:30 termina 14:00 → NO choca → disponible
    const newEnd = slotMin + newDurationMin;
    for (const booked of bookedSlots) {
      const bookedStart = slotToMinutes(booked.start_slot);
      if (slotMin < bookedStart && newEnd > bookedStart) {
        blocked.add(slot);
        break;
      }
    }
  }

  return blocked;
}

function TimePicker({
  selected,
  onSelect,
  accent,
  colors,
  bookedSlots,
  newDurationMin,
  openTime,
  closeTime,
  offHoursSurcharge,
  offHoursSurchargeType,
}: {
  selected: string;
  onSelect: (t: string) => void;
  accent: string;
  colors: any;
  bookedSlots: BookedSlot[];
  newDurationMin: number;
  openTime: string | null;
  closeTime: string | null;
  offHoursSurcharge: number;
  offHoursSurchargeType: 'fixed' | 'percent';
}) {
  const blockedSet = computeBlockedSlots(bookedSlots, newDurationMin);
  const hasSchedule = openTime !== null && closeTime !== null;

  const surchargeLabel = offHoursSurcharge > 0
    ? offHoursSurchargeType === 'percent'
      ? `Fuera de ${openTime}–${closeTime} tiene recargo de ${offHoursSurcharge}%`
      : `Fuera de ${openTime}–${closeTime} tiene recargo de $${offHoursSurcharge}`
    : `Horario laboral: ${openTime}–${closeTime}`;

  return (
    <View>
      {hasSchedule && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9F0A' }} />
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {surchargeLabel}
          </Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TIME_SLOTS.map((slot) => {
          const isSelected = slot === selected;
          const isBlocked = blockedSet.has(slot);
          const isOffHours = hasSchedule
            ? !isWithinWorkHours(slot, openTime!, closeTime!)
            : false;

          return (
            <Pressable
              key={slot}
              onPress={() => !isBlocked && onSelect(slot)}
              disabled={isBlocked}
              style={({ pressed }) => ({ opacity: isBlocked ? 0.4 : pressed ? 0.7 : 1 })}
            >
              <View style={{
                paddingHorizontal: 10, paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isBlocked
                  ? colors.surface
                  : isSelected ? accent : colors.surfaceElevated,
                borderWidth: 1.5,
                borderColor: isBlocked
                  ? colors.border
                  : isSelected ? accent
                  : isOffHours ? '#FF9F0A55' : 'transparent',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isBlocked ? 0 : 0.06,
                shadowRadius: 8,
                elevation: isBlocked ? 0 : 3,
                alignItems: 'center',
                minWidth: 68,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: isSelected ? '700' : '500',
                  color: isBlocked
                    ? colors.textTertiary
                    : isSelected ? '#fff'
                    : isOffHours ? '#FF9F0A' : colors.text,
                  textDecorationLine: isBlocked ? 'line-through' : 'none',
                }}>
                  {formatTime12(slot)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type Step = 'client' | 'services' | 'datetime' | 'employee' | 'notes';
const STEPS: Step[] = ['client', 'services', 'datetime', 'employee', 'notes'];
const STEP_LABEL: Record<Step, string> = {
  client: 'Cliente',
  services: 'Servicios',
  datetime: 'Fecha y hora',
  employee: 'Empleada',
  notes: 'Notas',
};

export default function NewAppointmentScreen() {
  const { colors, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();

  // Data
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: services = [], isLoading: loadingServices } = useServices();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: businessConfig } = useBusinessConfig();
  const createMutation = useCreateAppointment();

  // Form state
  const [step, setStep] = useState<Step>('client');
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(params.date ?? isoDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: bookedSlots = [] } = useBookedSlots(selectedDate);

  const currentStepIndex = STEPS.indexOf(step);

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 30);
    return clients.filter(c =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
    ).slice(0, 20);
  }, [clients, clientSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    return services.filter(s =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [services, serviceSearch]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const basePrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_min, 0) || 30;

  // Recargo: solo si hay servicios con applies_surcharge y la cita es fuera de horario/día laboral
  const isOffHoursDate = businessConfig
    ? !isWorkDate(selectedDate, businessConfig.work_days)
    : false;
  const isOffHoursTime = businessConfig
    ? !isWithinWorkHours(selectedTime, businessConfig.open_time, businessConfig.close_time)
    : false;
  const isOffHours = isOffHoursDate || isOffHoursTime;
  const surchargeServices = selectedServices.filter(s => s.applies_surcharge);
  const hasSurchargeServices = surchargeServices.length > 0;

  const surchargeAmount = (() => {
    if (!isOffHours || !hasSurchargeServices || !businessConfig) return 0;
    const config = businessConfig;
    if (config.off_hours_surcharge === 0) return 0;
    if (config.off_hours_surcharge_type === 'percent') {
      const surchargeBase = surchargeServices.reduce((sum, s) => sum + s.price, 0);
      return Math.round((surchargeBase * config.off_hours_surcharge) / 100 * 100) / 100;
    }
    return config.off_hours_surcharge;
  })();

  const totalPrice = basePrice + surchargeAmount;

  function toggleService(id: string) {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function canGoNext(): boolean {
    switch (step) {
      case 'client': return !!selectedClientId;
      case 'services': return selectedServiceIds.length > 0;
      case 'datetime': return !!selectedDate && !!selectedTime;
      case 'employee': return !!selectedEmployeeId;
      case 'notes': return true;
    }
  }

  function goNext() {
    if (!canGoNext()) {
      const msg: Record<Step, string> = {
        client: 'Selecciona una clienta para continuar',
        services: 'Elige al menos un servicio',
        datetime: 'Elige fecha y hora',
        employee: 'Asigna una empleada',
        notes: '',
      };
      Alert.alert('Falta información', msg[step]);
      return;
    }
    if (step === 'notes') {
      handleCreate();
    } else {
      setStep(STEPS[currentStepIndex + 1]);
    }
  }

  function goBack() {
    if (currentStepIndex === 0) {
      router.back();
    } else {
      setStep(STEPS[currentStepIndex - 1]);
    }
  }

  function isHeaderActionDisabled() {
    if (step === 'notes') return createMutation.isPending;
    return !canGoNext();
  }

  function getHeaderActionLabel() {
    return step === 'notes' ? 'Confirmar' : 'Continuar';
  }

  async function handleCreate() {
    const priceSnapshots: Record<string, number> = {};
    selectedServices.forEach(s => { priceSnapshots[s.id] = s.price; });

    // Construir fecha local y convertir a ISO UTC para Supabase
    const [h, m] = selectedTime.split(':').map(Number);
    const localDate = new Date(selectedDate + 'T00:00:00');
    localDate.setHours(h, m, 0, 0);
    const scheduledAt = localDate.toISOString();

    try {
      await createMutation.mutateAsync({
        client_id: selectedClientId,
        employee_id: selectedEmployeeId,
        scheduled_at: scheduledAt,
        notes: notes.trim() || undefined,
        service_ids: selectedServiceIds,
        price_snapshots: priceSnapshots,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear la cita');
    }
  }

  // ── Render step content ──────────────────────────────────────────────────

  function renderContent() {
    switch (step) {
      case 'client':
        return (
          <View>
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={clientSearch}
              onChangeText={setClientSearch}
              autoCorrect={false}
              containerStyle={{ marginBottom: 12 }}
            />
            {loadingClients ? (
              <ActivityIndicator color={accent} />
            ) : filteredClients.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                No se encontraron clientas
              </Text>
            ) : (
              filteredClients.map(client => (
                <SelectRow
                  key={client.id}
                  label={client.name}
                  selected={client.id === selectedClientId}
                  onPress={() => setSelectedClientId(client.id)}
                  accent={accent}
                  colors={colors}
                  icon={client.no_show_count > 0 ? '⚠️' : undefined}
                />
              ))
            )}
          </View>
        );

      case 'services':
        return (
          <View>
            <Input
              placeholder="Buscar servicio..."
              value={serviceSearch}
              onChangeText={setServiceSearch}
              autoCorrect={false}
              containerStyle={{ marginBottom: 16 }}
            />
            {loadingServices ? (
              <ActivityIndicator color={accent} />
            ) : filteredServices.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                No se encontraron servicios
              </Text>
            ) : (
              filteredServices.map(svc => (
                <CheckRow
                  key={svc.id}
                  label={svc.name}
                  sub={`${formatCurrency(svc.price)} · ${svc.duration_min} min`}
                  selected={selectedServiceIds.includes(svc.id)}
                  onPress={() => toggleService(svc.id)}
                  accent={accent}
                  colors={colors}
                  category={svc.category}
                />
              ))
            )}
            {selectedServiceIds.length > 0 && (
              <View style={{
                backgroundColor: accent + '18', borderRadius: 16,
                padding: 14, marginTop: 8, flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {selectedServiceIds.length} servicio{selectedServiceIds.length !== 1 ? 's' : ''}
                </Text>
                <Text style={{ fontWeight: '700', color: accent, fontSize: 16 }}>
                  {formatCurrency(totalPrice)}
                </Text>
              </View>
            )}
          </View>
        );

      case 'datetime':
        return (
          <View>
            <SectionLabel label="Fecha" colors={colors} />
            <DatePickerInline
              selected={selectedDate}
              onSelect={setSelectedDate}
              accent={accent}
              colors={colors}
              initialDate={selectedDate}
              workDays={businessConfig?.work_days}
            />
            {isOffHoursDate && hasSurchargeServices && businessConfig && businessConfig.off_hours_surcharge > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#FF9F0A18', borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 8, marginTop: 8,
              }}>
                <Ionicons name="moon-outline" size={14} color="#FF9F0A" />
                <Text style={{ fontSize: 12, color: '#FF9F0A', fontWeight: '600' }}>
                  Día fuera de horario — recargo de {businessConfig.off_hours_surcharge_type === 'percent'
                    ? `${businessConfig.off_hours_surcharge}% (+$${surchargeAmount})`
                    : `$${businessConfig.off_hours_surcharge}`}
                </Text>
              </View>
            )}
            <SectionLabel label="Hora" colors={colors} />
            <TimePicker
              selected={selectedTime}
              onSelect={setSelectedTime}
              accent={accent}
              colors={colors}
              bookedSlots={bookedSlots}
              newDurationMin={totalDuration}
              openTime={businessConfig?.open_time ?? null}
              closeTime={businessConfig?.close_time ?? null}
              offHoursSurcharge={businessConfig?.off_hours_surcharge ?? 0}
              offHoursSurchargeType={businessConfig?.off_hours_surcharge_type ?? 'fixed'}
            />
          </View>
        );

      case 'employee':
        return (
          <View>
            {loadingEmployees ? (
              <ActivityIndicator color={accent} />
            ) : employees.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                No hay empleadas registradas
              </Text>
            ) : (
              employees.map(emp => (
                <SelectRow
                  key={emp.id}
                  label={emp.full_name}
                  selected={emp.id === selectedEmployeeId}
                  onPress={() => setSelectedEmployeeId(emp.id)}
                  accent={accent}
                  colors={colors}
                />
              ))
            )}
          </View>
        );

      case 'notes':
        return (
          <View>
            {/* Summary */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 10, borderWidth: 1, borderColor: colors.border }}>
              <SummaryRow icon="person" label="Cliente" value={selectedClient?.name ?? ''} colors={colors} accent={accent} />
              <SummaryRow icon="brush" label="Servicios" value={selectedServices.map(s => s.name).join(', ')} colors={colors} accent={accent} />
              <SummaryRow
                icon="calendar"
                label="Fecha"
                value={`${new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} · ${selectedTime}`}
                colors={colors}
                accent={accent}
              />
              <SummaryRow icon="person-circle" label="Empleada" value={selectedEmployee?.full_name ?? ''} colors={colors} accent={accent} />
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
              <SummaryRow icon="cash" label="Subtotal" value={formatCurrency(basePrice)} colors={colors} accent={accent} />
              {surchargeAmount > 0 && (
                <SummaryRow
                  icon="alert-circle"
                  label="Recargo"
                  value={`+${formatCurrency(surchargeAmount)} (fuera de horario)`}
                  colors={colors}
                  accent="#FF9F0A"
                />
              )}
              <SummaryRow icon="wallet" label="Total" value={formatCurrency(totalPrice)} colors={colors} accent={accent} bold />
            </View>

            <Input
              label="Notas (opcional)"
              placeholder="Diseño solicitado, alergias, preferencias..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>
        );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Pressable
            onPress={goBack}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Nueva cita</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
              Paso {currentStepIndex + 1} de {STEPS.length} — {STEP_LABEL[step]}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={goNext}
          disabled={isHeaderActionDisabled()}
          style={({ pressed }) => ({
            minWidth: 92,
            marginLeft: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {createMutation.isPending && step === 'notes'
            ? <ActivityIndicator size="small" color={accent} />
            : (
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: isHeaderActionDisabled() ? colors.textSecondary : accent,
              }}>
                {getHeaderActionLabel()}
              </Text>
            )}
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 4 }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: accent, width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }} />
      </View>

      {/* Step title */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>{STEP_LABEL[step]}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{getStepHint(step)}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

    </SafeAreaView>
  );
}

function getStepHint(step: Step): string {
  switch (step) {
    case 'client': return 'Selecciona la clienta para esta cita';
    case 'services': return 'Elige uno o más servicios';
    case 'datetime': return 'Elige el día y la hora';
    case 'employee': return 'Asigna una empleada';
    case 'notes': return 'Revisa el resumen y agrega notas';
  }
}

function SummaryRow({
  icon, label, value, colors, accent, bold,
}: {
  icon: any; label: string; value: string; colors: any; accent: string; bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Ionicons name={icon} size={16} color={accent} style={{ marginTop: 2 }} />
      <Text style={{ fontSize: 13, color: colors.textSecondary, width: 64 }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: colors.text, fontWeight: bold ? '700' : '500' }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
