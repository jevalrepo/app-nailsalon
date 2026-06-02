import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import {
  useMonthlyRevenue,
  useTopServices,
  useTopClients,
  useStatsSummary,
} from '@/hooks/useStats';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, color, colors,
}: {
  icon: string; label: string; value: string; sub?: string; color: string; colors: any;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 18,
      padding: 14, gap: 6,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: color + '1A',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>
        {label}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 10, color: colors.textTertiary }}>{sub}</Text>
      ) : null}
    </View>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({ data, accent, colors }: { data: any[]; accent: string; colors: any }) {
  const maxIncome = Math.max(...data.map((d) => d.income), 1);

  return (
    <View style={{ marginTop: 8 }}>
      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 }}>
        {data.map((item, i) => {
          const heightPct = item.income / maxIncome;
          const isLast = i === data.length - 1;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 9, color: colors.textTertiary, marginBottom: 2 }}>
                {item.income > 0 ? `${Math.round(item.income / 1000)}k` : ''}
              </Text>
              <View
                style={{
                  width: '100%',
                  height: Math.max(heightPct * 80, item.income > 0 ? 4 : 0),
                  backgroundColor: isLast ? accent : accent + '55',
                  borderRadius: 6,
                }}
              />
            </View>
          );
        })}
      </View>
      {/* Labels */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
        {data.map((item, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 10,
              color: i === data.length - 1 ? colors.text : colors.textTertiary,
              fontWeight: i === data.length - 1 ? '600' : '400',
            }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 13, fontWeight: '700', color: colors.textSecondary,
      letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10,
    }}>
      {title}
    </Text>
  );
}

// ─── Service Row ─────────────────────────────────────────────────────────────

function ServiceRow({
  rank, name, count, total_revenue, maxCount, accent, colors,
}: {
  rank: number; name: string; count: number; total_revenue: number;
  maxCount: number; accent: string; colors: any;
}) {
  const barPct = maxCount > 0 ? count / maxCount : 0;

  return (
    <View style={{ paddingVertical: 10, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 22, height: 22, borderRadius: 7,
          backgroundColor: accent + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: accent }}>{rank}</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }} numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
          {count}x
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, minWidth: 60, textAlign: 'right' }}>
          {fmt(total_revenue)}
        </Text>
      </View>
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: colors.border, borderRadius: 2 }}>
        <View style={{
          height: 3, width: `${Math.round(barPct * 100)}%`,
          backgroundColor: accent, borderRadius: 2,
        }} />
      </View>
    </View>
  );
}

// ─── Client Row ──────────────────────────────────────────────────────────────

function ClientRow({
  rank, name, visits, total_spent, accent, colors,
}: {
  rank: number; name: string; visits: number; total_spent: number;
  accent: string; colors: any;
}) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: accent + '20',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: accent }}>{initials}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }} numberOfLines={1}>
        {name}
      </Text>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{fmt(total_spent)}</Text>
        <Text style={{ fontSize: 11, color: colors.textTertiary }}>{visits} visitas</Text>
      </View>
    </View>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SkeletonBox({ colors, h = 20, w = '100%', radius = 8 }: { colors: any; h?: number; w?: any; radius?: number }) {
  return (
    <View style={{
      height: h, width: w, borderRadius: radius,
      backgroundColor: colors.border,
    }} />
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { colors, accent } = useTheme();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { data: summary, isLoading: summaryLoading } = useStatsSummary(year, month);
  const { data: revenueData, isLoading: revenueLoading } = useMonthlyRevenue(6);
  const { data: topServices, isLoading: servicesLoading } = useTopServices(year, month);
  const { data: topClients, isLoading: clientsLoading } = useTopClients(year, month);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
            Estadísticas
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 }}
      >

        {/* ── Selector de mes ─────────────────────── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: colors.surfaceElevated, borderRadius: 16,
          paddingHorizontal: 6, paddingVertical: 8, marginBottom: 20,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        }}>
          <Pressable
            onPress={prevMonth}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              width: 36, height: 36, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {MONTH_NAMES[month]} {year}
          </Text>

          <Pressable
            onPress={nextMonth}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              width: 36, height: 36, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isCurrentMonth ? colors.textTertiary : colors.text}
            />
          </Pressable>
        </View>

        {/* ── KPIs ────────────────────────────────── */}
        <SectionHeader title="Resumen del mes" colors={colors} />

        {summaryLoading ? (
          <View style={{ gap: 10, marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SkeletonBox colors={colors} h={90} w="48%" radius={18} />
              <SkeletonBox colors={colors} h={90} w="48%" radius={18} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SkeletonBox colors={colors} h={90} w="48%" radius={18} />
              <SkeletonBox colors={colors} h={90} w="48%" radius={18} />
            </View>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                icon="cash-outline"
                label="Ingresos"
                value={fmt(summary?.month_income ?? 0)}
                color={colors.success}
                colors={colors}
              />
              <KpiCard
                icon="trending-down-outline"
                label="Gastos"
                value={fmt(summary?.month_expenses ?? 0)}
                color={colors.destructive}
                colors={colors}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                icon="wallet-outline"
                label="Neto"
                value={fmt(summary?.month_net ?? 0)}
                sub={(summary?.month_net ?? 0) >= 0 ? 'Ganancia' : 'Pérdida'}
                color={accent}
                colors={colors}
              />
              <KpiCard
                icon="checkmark-circle-outline"
                label="Completadas"
                value={`${summary?.completion_rate ?? 0}%`}
                sub={`${summary?.completed_appointments ?? 0} de ${summary?.total_appointments ?? 0} citas`}
                color={colors.success}
                colors={colors}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                icon="people-outline"
                label="Clientas totales"
                value={String(summary?.total_clients ?? 0)}
                color={accent}
                colors={colors}
              />
              <KpiCard
                icon="close-circle-outline"
                label="No asistieron"
                value={String(summary?.no_show_count ?? 0)}
                sub="este mes"
                color={colors.warning}
                colors={colors}
              />
            </View>
          </View>
        )}

        {/* ── Ingresos últimos 6 meses ─────────────── */}
        <SectionHeader title="Ingresos últimos 6 meses" colors={colors} />
        <View style={{
          backgroundColor: colors.surfaceElevated, borderRadius: 20,
          padding: 18, marginBottom: 28,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          {revenueLoading ? (
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={accent} />
            </View>
          ) : (
            <>
              <BarChart data={revenueData ?? []} accent={accent} colors={colors} />
              {/* Total acumulado */}
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                marginTop: 14, paddingTop: 12,
                borderTopWidth: 1, borderTopColor: colors.borderLight,
              }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total 6 meses</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                  {fmt((revenueData ?? []).reduce((s, d) => s + d.income, 0))}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── Top servicios ────────────────────────── */}
        <SectionHeader title="Servicios más solicitados" colors={colors} />
        <View style={{
          backgroundColor: colors.surfaceElevated, borderRadius: 20,
          paddingHorizontal: 16, marginBottom: 28,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          {servicesLoading ? (
            <View style={{ padding: 20, gap: 12 }}>
              {[1, 2, 3].map((i) => <SkeletonBox key={i} colors={colors} h={40} radius={10} />)}
            </View>
          ) : !topServices || topServices.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center', gap: 8 }}>
              <Ionicons name="sparkles-outline" size={32} color={colors.textTertiary} />
              <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                Sin citas completadas este mes
              </Text>
            </View>
          ) : (
            topServices.map((svc, i) => (
              <ServiceRow
                key={svc.service_id}
                rank={i + 1}
                name={svc.name}
                count={svc.count}
                total_revenue={svc.total_revenue}
                maxCount={topServices[0].count}
                accent={accent}
                colors={colors}
              />
            ))
          )}
        </View>

        {/* ── Top clientas ─────────────────────────── */}
        <SectionHeader title="Clientas frecuentes" colors={colors} />
        <View style={{
          backgroundColor: colors.surfaceElevated, borderRadius: 20,
          paddingHorizontal: 16, marginBottom: 8,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          {clientsLoading ? (
            <View style={{ padding: 20, gap: 12 }}>
              {[1, 2, 3].map((i) => <SkeletonBox key={i} colors={colors} h={52} radius={10} />)}
            </View>
          ) : !topClients || topClients.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center', gap: 8 }}>
              <Ionicons name="person-outline" size={32} color={colors.textTertiary} />
              <Text style={{ fontSize: 13, color: colors.textTertiary }}>
                Sin datos este mes
              </Text>
            </View>
          ) : (
            topClients.map((client, i) => (
              <ClientRow
                key={client.client_id}
                rank={i + 1}
                name={client.name}
                visits={client.visits}
                total_spent={client.total_spent}
                accent={accent}
                colors={colors}
              />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
