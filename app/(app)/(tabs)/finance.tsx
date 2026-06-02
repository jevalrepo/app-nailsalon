import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import {
  useMonthSummary,
  useMonthTransactions,
  type Transaction,
} from '@/hooks/useFinance';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PAYMENT_ICON: Record<string, string> = {
  cash: 'cash-outline',
  card: 'card-outline',
  transfer: 'swap-horizontal-outline',
};

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function TransactionRow({
  tx, colors, accent, isLast,
}: {
  tx: Transaction; colors: any; accent: string; isLast: boolean;
}) {
  const isIncome    = tx.type === 'income';
  const amountColor = isIncome ? '#30D158' : '#FF453A';
  const iconName    = (PAYMENT_ICON[tx.payment_method] ?? 'wallet-outline') as any;

  return (
    <Pressable
      onPress={() => router.push(`/finance/${tx.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderLight,
      }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: isIncome ? '#30D15818' : '#FF453A18',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={iconName} size={18} color={amountColor} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {tx.description}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {formatDate(tx.date)} · {tx.category}
          </Text>
        </View>

        <Text style={{ fontSize: 15, fontWeight: '700', color: amountColor }}>
          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
        </Text>

        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

export default function FinanceScreen() {
  const { colors, accent } = useTheme();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const {
    data: summary,
    isLoading: loadingSummary,
    isFetching: fetchingSummary,
    isError: summaryError,
    error: summaryErrorValue,
    refetch: refetchSummary,
  } = useMonthSummary(year, month);
  const {
    data: transactions = [],
    isLoading: loadingTx,
    isFetching: fetchingTx,
    isError: txError,
    error: txErrorValue,
    refetch: refetchTransactions,
  } = useMonthTransactions(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const ny = month === 11 ? year + 1 : year;
    const nm = month === 11 ? 0 : month + 1;
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth())) return;
    setYear(ny); setMonth(nm);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Finanzas</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {(fetchingSummary || fetchingTx) && !(loadingSummary || loadingTx) && (
                <ActivityIndicator size="small" color={accent} />
              )}
              {/* Botón cierre de caja */}
              <Pressable
                onPress={() => router.push('/finance/close')}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 12,
                  backgroundColor: accent + '18',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="calculator-outline" size={20} color={accent} />
                </View>
              </Pressable>

              {/* Botón nueva transacción */}
              <Pressable
                onPress={() => router.push('/finance/new')}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 12,
                  backgroundColor: accent,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="add" size={22} color="#fff" />
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Selector de mes ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 16, paddingVertical: 12,
        }}>
          <Pressable onPress={prevMonth} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Ionicons name="chevron-back" size={22} color={accent} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, minWidth: 150, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Pressable
            onPress={nextMonth}
            hitSlop={12}
            disabled={isCurrentMonth}
            style={({ pressed }) => ({ opacity: isCurrentMonth ? 0.3 : pressed ? 0.5 : 1 })}
          >
            <Ionicons name="chevron-forward" size={22} color={accent} />
          </Pressable>
        </View>

        {/* ── Tarjetas de resumen ── */}
        {loadingSummary ? (
          <ActivityIndicator color={accent} style={{ marginTop: 16 }} />
        ) : summaryError ? (
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
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
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                No se pudo cargar el resumen
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                {(summaryErrorValue as Error)?.message ?? 'Intenta de nuevo'}
              </Text>
              <Pressable onPress={() => refetchSummary()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 12, alignSelf: 'flex-start' })}>
                <View style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Reintentar</Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            {/* Card principal — Neto del mes */}
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 24, padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }}>
                Balance del mes
              </Text>
              <Text style={{
                fontSize: 40, fontWeight: '800', marginTop: 6, marginBottom: 20,
                color: (summary?.net ?? 0) >= 0 ? colors.text : '#FF453A',
                textAlign: 'center',
              }}>
                {formatCurrency(summary?.net ?? 0)}
              </Text>

              {/* Fila ingresos / gastos */}
              <View style={{
                flexDirection: 'row',
                borderTopWidth: 1, borderTopColor: colors.borderLight,
                paddingTop: 16, gap: 0,
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: '#30D158',
                    }} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
                      Ingresos
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#30D158' }}>
                    {formatCurrency(summary?.income ?? 0)}
                  </Text>
                </View>

                {/* Separador vertical */}
                <View style={{ width: 1, backgroundColor: colors.borderLight, marginVertical: 2 }} />

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: '#FF453A',
                    }} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
                      Gastos
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#FF453A' }}>
                    {formatCurrency(summary?.expenses ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Acceso rápido: Cierre de caja ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Pressable
            onPress={() => router.push('/finance/close')}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: colors.surfaceElevated,
              borderRadius: 20, padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: accent + '18',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="calculator" size={22} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  Cierre de caja
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  Resumen diario por método de pago
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* ── Movimientos del mes ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Movimientos</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {transactions.length} registros
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
            {MONTH_NAMES[month]} {year}
          </Text>

          {loadingTx ? (
            <ActivityIndicator color={accent} />
          ) : txError ? (
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.textTertiary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 12 }}>
                No se pudieron cargar los movimientos
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                {(txErrorValue as Error)?.message ?? 'Intenta de nuevo'}
              </Text>
              <Pressable onPress={() => refetchTransactions()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 16 })}>
                <View style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Reintentar</Text>
                </View>
              </Pressable>
            </View>
          ) : transactions.length === 0 ? (
            /* Empty state */
            <Pressable
              onPress={() => router.push('/finance/new')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View style={{
                backgroundColor: colors.surface, borderRadius: 20, padding: 36,
                alignItems: 'center', borderWidth: 1, borderColor: colors.border,
              }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 20,
                  backgroundColor: accent + '18',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Ionicons name="wallet-outline" size={30} color={accent} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                  Sin movimientos
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                  Toca aquí para registrar{'\n'}tu primer ingreso o gasto
                </Text>
                <View style={{
                  marginTop: 20, paddingHorizontal: 20, paddingVertical: 10,
                  backgroundColor: accent, borderRadius: 12,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nuevo movimiento</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            /* Lista agrupada por día */
            <View style={{ gap: 20 }}>
              {sortedDates.map((date) => {
                const rows     = grouped[date];
                const d        = new Date(date + 'T12:00:00');
                const dayLabel = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                const dayTotal = rows.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

                return (
                  <View key={date}>
                    <View style={{
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontSize: 12, fontWeight: '600', color: colors.textSecondary,
                        textTransform: 'capitalize',
                      }}>
                        {dayLabel}
                      </Text>
                      <Text style={{
                        fontSize: 12, fontWeight: '700',
                        color: dayTotal >= 0 ? '#30D158' : '#FF453A',
                      }}>
                        {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                      </Text>
                    </View>

                    <View style={{
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: 20, paddingHorizontal: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                    }}>
                      {rows.map((tx, i) => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          colors={colors}
                          accent={accent}
                          isLast={i === rows.length - 1}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
