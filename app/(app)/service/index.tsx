import { useMemo } from 'react';
import { View, Text, SectionList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAllServices } from '@/hooks/useServices';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Service, ServiceCategory } from '@/types';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  manicure: 'Manicure',
  pedicure: 'Pedicure',
  gel:      'Gel',
  acrilico: 'Acrílico',
  otro:     'Otro',
};

const CATEGORY_ICONS: Record<ServiceCategory, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
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

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function ServiceCard({ service, colors, onPress }: { service: Service; colors: any; onPress: () => void }) {
  const catColor = CATEGORY_COLORS[service.category];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, padding: 16, marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        {/* Ícono de categoría */}
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: catColor + '22',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Ionicons name={CATEGORY_ICONS[service.category]} size={18} color={catColor} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
              {service.name}
            </Text>
            {!service.is_active && (
              <View style={{
                backgroundColor: colors.surface, borderRadius: 6,
                paddingHorizontal: 6, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textTertiary }}>Inactivo</Text>
              </View>
            )}
          </View>
          {service.description ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {service.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={{ fontSize: 12, color: colors.textTertiary }}>
              {formatDuration(service.duration_min)}
            </Text>
          </View>
        </View>

        {/* Precio */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: catColor }}>
            ${service.price % 1 === 0 ? service.price.toFixed(0) : service.price.toFixed(2)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </View>
    </Pressable>
  );
}

function SectionHeader({ title, icon, count, catColor, colors }: {
  title: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  count: number;
  catColor: string;
  colors: any;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 10, paddingHorizontal: 2,
      backgroundColor: colors.background,
    }}>
      <View style={{
        width: 24, height: 24, borderRadius: 7,
        backgroundColor: catColor + '22',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={13} color={catColor} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{title}</Text>
      <View style={{
        backgroundColor: catColor + '22', borderRadius: 8,
        paddingHorizontal: 7, paddingVertical: 2,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>{count}</Text>
      </View>
    </View>
  );
}

export default function ServicesScreen() {
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const {
    data: services = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAllServices();

  const sections = useMemo(() => {
    const order: ServiceCategory[] = ['manicure', 'pedicure', 'gel', 'acrilico', 'otro'];
    const grouped: Record<string, Service[]> = {};
    for (const s of services) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    }
    return order
      .filter((cat) => grouped[cat]?.length > 0)
      .map((cat) => ({
        title: CATEGORY_LABELS[cat],
        icon: CATEGORY_ICONS[cat],
        catColor: CATEGORY_COLORS[cat],
        category: cat,
        data: grouped[cat],
      }));
  }, [services]);

  const totalActive = services.filter((s) => s.is_active).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Servicios</Text>
            {services.length > 0 && (
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {totalActive} activo{totalActive !== 1 ? 's' : ''}
                {services.length !== totalActive
                  ? ` · ${services.length - totalActive} inactivo${services.length - totalActive !== 1 ? 's' : ''}`
                  : ''}
              </Text>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isFetching && !isLoading && (
              <ActivityIndicator size="small" color={accent} />
            )}
            {services.length > 0 && (
              <View style={{
                backgroundColor: accent + '18', borderRadius: 10,
                paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: accent }}>{totalActive}</Text>
              </View>
            )}
            {isAdmin && (
              <Pressable
                onPress={() => router.push('/service/new')}
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
            )}
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 20 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
            Error al cargar servicios
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 16, textAlign: 'center' }}>
            {(error as Error)?.message ?? 'Intenta de nuevo'}
          </Text>
          <Pressable onPress={() => refetch()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Reintentar</Text>
            </View>
          </Pressable>
        </View>
      ) : services.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: accent + '18',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="cut-outline" size={32} color={accent} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            Sin servicios registrados
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
            Agrega el primer servicio
          </Text>
          {isAdmin && (
            <Pressable
              onPress={() => router.push('/service/new')}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                backgroundColor: accent, borderRadius: 14,
                paddingHorizontal: 24, paddingVertical: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nuevo servicio</Text>
              </View>
            </Pressable>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              colors={colors}
              onPress={() => router.push(`/service/${item.id}`)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              icon={section.icon}
              count={section.data.length}
              catColor={section.catColor}
              colors={colors}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          stickySectionHeadersEnabled={false}
          onRefresh={refetch}
          refreshing={false}
        />
      )}
    </SafeAreaView>
  );
}
