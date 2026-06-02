import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useInventory, isLowStock } from '@/hooks/useInventory';
import { useAuthStore } from '@/stores/useAuthStore';
import type { InventoryItem } from '@/types';

function StockBadge({ item }: { item: InventoryItem }) {
  const low = isLowStock(item);
  const bg  = low ? '#FF453A18' : '#30D15818';
  const fg  = low ? '#FF453A'   : '#30D158';
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: fg }}>{low ? 'Bajo stock' : 'OK'}</Text>
    </View>
  );
}

function InventoryRow({
  item, colors, accent, onPress,
}: {
  item: InventoryItem; colors: any; accent: string; onPress: () => void;
}) {
  const low = isLowStock(item);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, padding: 16, marginBottom: 8,
        borderWidth: low ? 1 : 0, borderColor: low ? '#FF453A' : colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        <View style={{
          width: 42, height: 42, borderRadius: 13,
          backgroundColor: low ? '#FF453A18' : accent + '18',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <Ionicons name={low ? 'warning-outline' : 'cube-outline'} size={20} color={low ? '#FF453A' : accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Mín: {item.min_stock} {item.unit}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: low ? '#FF453A' : colors.text }}>
            {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity.toFixed(1)}{' '}
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>{item.unit}</Text>
          </Text>
          <StockBadge item={item} />
        </View>
      </View>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading, isFetching, isError, error, refetch } = useInventory();

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const lowCount = items.filter(isLowStock).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Inventario</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isFetching && !isLoading && <ActivityIndicator size="small" color={accent} />}
            {lowCount > 0 && (
              <View style={{ backgroundColor: '#FF453A18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF453A' }}>{lowCount}</Text>
              </View>
            )}
            {isAdmin && (
              <Pressable onPress={() => router.push('/inventory/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add" size={22} color="#fff" />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {items.length > 0 && (
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            {items.length} producto{items.length !== 1 ? 's' : ''}
            {lowCount > 0 ? ` · ${lowCount} con bajo stock` : ''}
          </Text>
        )}

        {items.length > 0 && (
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surface, borderRadius: 14,
            paddingHorizontal: 12, height: 42,
          }}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Buscar producto..." placeholderTextColor={colors.placeholder}
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.text }}
              returnKeyType="search" clearButtonMode="while-editing"
            />
          </View>
        )}
      </View>

      {/* ── Contenido ── */}
      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 20 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' }}>Error al cargar inventario</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 16, textAlign: 'center' }}>
            {(error as Error)?.message ?? 'Intenta de nuevo'}
          </Text>
          <Pressable onPress={() => refetch()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Reintentar</Text>
            </View>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="cube-outline" size={32} color={accent} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Sin productos en inventario</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
            Registra el primer producto
          </Text>
          {isAdmin && (
            <Pressable onPress={() => router.push('/inventory/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ backgroundColor: accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nuevo producto</Text>
              </View>
            </Pressable>
          )}
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Ionicons name="search-outline" size={36} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Sin resultados</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>No hay productos con ese nombre</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InventoryRow item={item} colors={colors} accent={accent} onPress={() => router.push(`/inventory/${item.id}`)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          onRefresh={refetch} refreshing={false}
          bounces={false} overScrollMode="never"
        />
      )}
    </SafeAreaView>
  );
}
