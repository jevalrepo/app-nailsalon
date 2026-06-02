import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import {
  useAppointmentCalendarMonth,
  useAppointmentsByDate,
  type AppointmentListItem,
} from '@/hooks/useAppointments';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No llegó',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#FF9F0A',
  confirmed: '#7DD3FC',
  completed: '#30D158',
  cancelled: '#FF453A',
  no_show: '#A0A0A0',
};

const WEEKDAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(/[\s\u202f]/g, '');
}

function formatSelectedLabel(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  const weekday = WEEKDAY_NAMES[date.getDay()] ?? '';
  const month = MONTH_NAMES[date.getMonth()]?.toLowerCase() ?? '';
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date.getDate()} de ${month}`;
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }
  return rows;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarGrid({
  year,
  month,
  selectedDate,
  today,
  appointmentDateSet,
  birthdayDateSet,
  accent,
  colors,
  onSelectDate,
}: {
  year: number;
  month: number;
  selectedDate: Date;
  today: Date;
  appointmentDateSet: Set<string>;
  birthdayDateSet: Set<string>;
  accent: string;
  colors: any;
  onSelectDate: (date: Date) => void;
}) {
  const rows = buildMonthGrid(year, month);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.2 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((week, weekIndex) => (
        <View key={weekIndex} style={{ flexDirection: 'row' }}>
          {week.map((day, dayIndex) => {
            if (!day) {
              return (
                <View
                  key={dayIndex}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 3,
                  }}
                >
                  <View style={{ width: 30, height: 35 }} />
                </View>
              );
            }

            const dateKey = isoDate(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const hasAppointments = appointmentDateSet.has(dateKey);
            const hasBirthday = birthdayDateSet.has(dateKey);

            const bgColor = isSelected
              ? accent
              : isToday
                ? `${accent}18`
                : 'transparent';

            const textColor = isSelected
              ? '#fff'
              : isToday
                ? accent
                : colors.text;

            return (
              <View
                key={dayIndex}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 3,
                }}
              >
                <Pressable
                  onPress={() => onSelectDate(day)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: bgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isToday || isSelected ? '700' : '400',
                        color: textColor,
                      }}
                    >
                      {day.getDate()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 3, minHeight: 8, marginTop: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {hasAppointments ? (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : accent,
                        }}
                      />
                    ) : (
                      <View style={{ width: 5, height: 5 }} />
                    )}
                    {hasBirthday ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : accent + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="gift"
                          size={7}
                          color={isSelected ? '#fff' : accent}
                        />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function AppointmentRow({ item, colors }: { item: AppointmentListItem; colors: any }) {
  const statusColor = STATUS_COLOR[item.status] ?? '#A0A0A0';

  return (
    <Pressable
      onPress={() => router.push(`/(app)/appointment/${item.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 20,
          padding: 16,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View style={{ width: 4, height: 44, borderRadius: 2, backgroundColor: statusColor }} />

        <View style={{ width: 52, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
            {formatTime(item.scheduled_at)}
          </Text>
        </View>

        <View style={{ width: 1, height: 36, backgroundColor: colors.borderLight }} />

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {item.client_name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {item.service_names.join(', ') || 'Sin servicio'}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {formatCurrency(item.total_price)}
          </Text>
          <View
            style={{
              backgroundColor: statusColor + '22',
              borderRadius: 6,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function AppointmentsScreen() {
  const { colors, accent } = useTheme();
  const today = new Date();

  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(isoDate(today));

  const {
    data: monthMeta,
    isLoading: loadingMonthMeta,
  } = useAppointmentCalendarMonth(displayYear, displayMonth);

  const {
    data: appointments = [],
    isLoading,
  } = useAppointmentsByDate(selectedDate);

  const appointmentDateSet = useMemo(
    () => new Set(monthMeta?.appointmentDates ?? []),
    [monthMeta?.appointmentDates],
  );
  const birthdayDateSet = useMemo(
    () => new Set(monthMeta?.birthdayDates ?? []),
    [monthMeta?.birthdayDates],
  );

  useEffect(() => {
    const selected = new Date(`${selectedDate}T12:00:00`);
    if (selected.getFullYear() !== displayYear || selected.getMonth() !== displayMonth) {
      setSelectedDate(isoDate(new Date(displayYear, displayMonth, 1)));
    }
  }, [displayMonth, displayYear, selectedDate]);

  const selectedLabel = formatSelectedLabel(selectedDate);

  function previousMonth() {
    if (displayMonth === 0) {
      setDisplayYear((year) => year - 1);
      setDisplayMonth(11);
      return;
    }
    setDisplayMonth((month) => month - 1);
  }

  function nextMonth() {
    if (displayMonth === 11) {
      setDisplayYear((year) => year + 1);
      setDisplayMonth(0);
      return;
    }
    setDisplayMonth((month) => month + 1);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Citas</Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textTertiary,
                marginTop: 2,
              }}
            >
              {selectedLabel}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push({ pathname: '/(app)/appointment/new', params: { date: selectedDate } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            accessibilityRole="button"
            accessibilityLabel="Nueva cita"
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>

      <Card variant="elevated" padding={0} style={{ marginHorizontal: 20, marginBottom: 14, paddingVertical: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
        >
          <Pressable
            onPress={previousMonth}
            hitSlop={12}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              padding: 6,
            })}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 17,
              fontWeight: '800',
              color: colors.text,
              letterSpacing: -0.3,
            }}
          >
            {MONTH_NAMES[displayMonth]} {displayYear}
          </Text>

          <Pressable
            onPress={nextMonth}
            hitSlop={12}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              padding: 6,
            })}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={{ overflow: 'hidden' }}>
          {loadingMonthMeta ? (
            <ActivityIndicator color={accent} style={{ marginVertical: 24 }} />
          ) : (
            <CalendarGrid
              year={displayYear}
              month={displayMonth}
              selectedDate={new Date(`${selectedDate}T12:00:00`)}
              today={today}
              appointmentDateSet={appointmentDateSet}
              birthdayDateSet={birthdayDateSet}
              accent={accent}
              colors={colors}
              onSelectDate={(date) => setSelectedDate(isoDate(date))}
            />
          )}
        </View>
      </Card>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {isLoading ? (
          <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <Pressable
            onPress={() => router.push({ pathname: '/(app)/appointment/new', params: { date: selectedDate } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 20, padding: 36,
              alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}>
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: accent + '18',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="calendar-outline" size={30} color={accent} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                Sin citas este día
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                Toca aquí para agendar{'\n'}una nueva cita
              </Text>
              <View style={{
                marginTop: 20, paddingHorizontal: 20, paddingVertical: 10,
                backgroundColor: accent, borderRadius: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nueva cita</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AppointmentRow item={item} colors={colors} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
