import { useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useDayCashClose, useMonthTransactions } from '@/hooks/useFinance';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function StatRow({
  label, value, color, bold = false, colors, last = false,
}: {
  label: string; value: string; color?: string; bold?: boolean; colors: any; last?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: last ? 0 : 0,
    }}>
      <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: bold ? '600' : '400' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: bold ? '800' : '600', color: color ?? colors.text }}>
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase',
      marginTop: 24, marginBottom: 8,
      paddingHorizontal: 4,
    }}>
      {label}
    </Text>
  );
}

export default function CashCloseScreen() {
  const { colors, accent } = useTheme();
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const { data: summary, isLoading } = useDayCashClose(selectedDate);

  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const { data: monthTxs = [] } = useMonthTransactions(year, month);

  // Obtiene los días únicos con movimientos en el mes
  const daysWithTx = [...new Set(monthTxs.map(t => t.date))].sort((a, b) => b.localeCompare(a));
  const selectableDays = [todayISO(), ...daysWithTx.filter(d => d !== todayISO())];
  const showDaySelector = selectableDays.length > 1;

  const netColor = !summary
    ? colors.text
    : summary.net >= 0 ? '#30D158' : '#FF453A';

  const cardStyle = {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            backgroundColor: colors.surface,
            borderRadius: 10, padding: 8,
          })}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: colors.text }}>
          Cierre de caja
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {showDaySelector ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
          >
            {selectableDays.map((day) => {
              const selected = selectedDate === day;
              const d = new Date(day + 'T12:00:00');
              const dayNum   = d.getDate();
              const monthStr = d.toLocaleDateString('es-MX', { month: 'short' });
              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDate(day)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    alignItems: 'center', justifyContent: 'center',
                    width: 54, paddingVertical: 10, borderRadius: 14,
                    backgroundColor: selected ? accent : colors.surface,
                    borderWidth: 1.5,
                    borderColor: selected ? accent : colors.border,
                  })}
                >
                  <Text style={{ fontSize: 11, color: selected ? '#fff' : colors.textSecondary, fontWeight: '500' }}>
                    {monthStr}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: selected ? '#fff' : colors.text }}>
                    {dayNum}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: showDaySelector ? 12 : 4, marginBottom: 4, textTransform: 'capitalize' }}>
            {formatDateLabel(selectedDate)}
          </Text>
        </View>

        {/* Resumen */}
        {isLoading ? (
          <ActivityIndicator color={accent} style={{ marginTop: 32 }} />
        ) : summary ? (
          <View style={{ paddingHorizontal: 20 }}>

            {/* Tarjeta neto del día */}
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 20, padding: 24,
              alignItems: 'center', marginTop: 16, marginBottom: 8,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
                Balance del día
              </Text>
              <Text style={{ fontSize: 44, fontWeight: '800', color: netColor }}>
                {formatCurrency(summary.net)}
              </Text>
              <View style={{
                flexDirection: 'row', gap: 20, marginTop: 16,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Ingresos</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#30D158' }}>
                    {formatCurrency(summary.total_income)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Egresos</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FF453A' }}>
                    {formatCurrency(summary.total_expenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Desglose por método */}
            <SectionTitle label="Ingresos por método" colors={colors} />
            <View style={cardStyle}>
              <StatRow
                label="Efectivo"
                value={formatCurrency(summary.cash_income)}
                color="#30D158"
                colors={colors}
              />
              <StatRow
                label="Tarjeta"
                value={formatCurrency(summary.card_income)}
                color="#30D158"
                colors={colors}
              />
              <StatRow
                label="Transferencia"
                value={formatCurrency(summary.transfer_income)}
                color="#30D158"
                colors={colors}
              />
              <StatRow
                label="Total ingresos"
                value={formatCurrency(summary.total_income)}
                color="#30D158"
                bold
                colors={colors}
                last
              />
            </View>

            {/* Egresos */}
            <SectionTitle label="Egresos" colors={colors} />
            <View style={cardStyle}>
              <StatRow
                label="Total egresos"
                value={formatCurrency(summary.total_expenses)}
                color="#FF453A"
                bold
                colors={colors}
                last
              />
            </View>

            {/* Balance final */}
            <SectionTitle label="Balance" colors={colors} />
            <View style={cardStyle}>
              <StatRow
                label="Efectivo en caja"
                value={formatCurrency(summary.cash_income - summary.cash_expenses)}
                colors={colors}
              />
              <StatRow
                label="Neto del día"
                value={formatCurrency(summary.net)}
                color={netColor}
                bold
                colors={colors}
                last
              />
            </View>
          </View>
        ) : (
          <View style={{
            margin: 20, backgroundColor: colors.surfaceElevated,
            borderRadius: 20, padding: 32, alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
              Sin movimientos
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
              No hay transacciones registradas para este día
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
