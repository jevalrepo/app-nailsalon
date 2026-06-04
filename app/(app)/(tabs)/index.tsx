import { View, Text, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useTodayAppointments, useTodayIncome } from '@/hooks/useHomeData';
import type { TodayAppointment } from '@/hooks/useHomeData';
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCachedLogoUri } from '@/hooks/useCachedLogoUri';

const BUSINESS_CONFIG_KEY = 'coraline-business-config';
const DEFAULT_BUSINESS_NAME = 'Coraline Nails';

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function AppointmentCard({ item, colors, accent }: { item: TodayAppointment; colors: any; accent: string }) {
  const statusColor = STATUS_COLOR[item.status] ?? '#A0A0A0';

  return (
    <Pressable
      onPress={() => router.push(`/(app)/appointment/${item.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, padding: 16, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        {/* Indicador de estado */}
        <View style={{ width: 4, height: 44, borderRadius: 2, backgroundColor: statusColor }} />

        {/* Hora */}
        <View style={{ width: 52, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
            {formatTime(item.scheduled_at)}
          </Text>
        </View>

        {/* Separador */}
        <View style={{ width: 1, height: 36, backgroundColor: colors.borderLight }} />

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {item.client_name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {item.service_names.join(', ') || 'Sin servicio'}
          </Text>
        </View>

        {/* Precio + badge */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {formatCurrency(item.total_price)}
          </Text>
          <View style={{ backgroundColor: statusColor + '22', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors, accent } = useTheme();
  const { org } = useActiveOrg();
  const { branch, isMulti: isMultiBranch } = useActiveBranch();
  const cachedLogoUri = useCachedLogoUri(org?.id, org?.logo_url);
  const logoUri = cachedLogoUri ?? org?.logo_url ?? null;
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);

  const { data: appointments = [], isLoading: loadingAppts } = useTodayAppointments();
  const { data: income = 0, isLoading: loadingIncome } = useTodayIncome();

  useEffect(() => {
    AsyncStorage.getItem(BUSINESS_CONFIG_KEY).then(raw => {
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.businessName) setBusinessName(parsed.businessName);
      }
    });
  }, []);

  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const completed = appointments.filter((a) => a.status === 'completed').length;
  const pending   = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 13, color: colors.textTertiary, textTransform: 'capitalize' }}>
            {todayLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: logoUri ? 'transparent' : accent + '20',
                borderWidth: logoUri ? 0 : 1.5,
                borderColor: accent + '40',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                ) : (
                  <Ionicons name="sparkles" size={20} color={accent} />
                )}
              </View>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                  {org?.name ?? businessName}
                </Text>
                {branch && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="storefront-outline" size={11} color={colors.textSecondary} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{branch.name}</Text>
                  </View>
                )}
              </View>
            </View>
            <SyncStatusBadge />
          </View>
        </View>

        {/* ── Stat cards ── */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
          {/* Citas hoy */}
          <View style={{
            flex: 1, backgroundColor: colors.surfaceElevated,
            borderRadius: 20, padding: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Citas hoy</Text>
              <View style={{
                width: 28, height: 28, borderRadius: 8,
                backgroundColor: accent + '18',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="calendar" size={14} color={accent} />
              </View>
            </View>
            {loadingAppts ? (
              <ActivityIndicator color={accent} />
            ) : (
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text }}>{appointments.length}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: '#30D158', fontWeight: '500' }}>
                {completed} listas
              </Text>
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>·</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>
                {pending} por atender
              </Text>
            </View>
          </View>

          {/* Ingresos hoy */}
          <View style={{
            flex: 1, backgroundColor: colors.surfaceElevated,
            borderRadius: 20, padding: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Ingresos hoy</Text>
              <View style={{
                width: 28, height: 28, borderRadius: 8,
                backgroundColor: '#30D15818',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="trending-up" size={14} color="#30D158" />
              </View>
            </View>
            {loadingIncome ? (
              <ActivityIndicator color={accent} />
            ) : (
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
                {formatCurrency(income)}
              </Text>
            )}
            <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 8 }}>
              del día de hoy
            </Text>
          </View>
        </View>

        {/* ── Agenda del día ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Agenda del día</Text>
            <Pressable
              onPress={() => router.push('/(app)/appointment/new')}
              style={({ pressed }) => ({
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: accent,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>

          {loadingAppts ? (
            <ActivityIndicator color={accent} />
          ) : appointments.length === 0 ? (
            <Pressable
              onPress={() => router.push('/(app)/appointment/new')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View style={{
                backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 36,
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
                  Sin citas para hoy
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
            appointments.map((item) => (
              <AppointmentCard key={item.id} item={item} colors={colors} accent={accent} />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
