import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useGallery, type DesignWithUrl } from '@/hooks/useGallery';

const NUM_COLUMNS = 2;
const GAP = 8;
const H_PADDING = 16;

function TagChip({
  tag, active, accent, colors, onPress,
}: {
  tag: string; active: boolean; accent: string; colors: any; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: active ? accent : colors.surface,
        borderWidth: active ? 0 : 1, borderColor: colors.border,
        marginRight: 8,
      }}>
        <Text style={{ fontSize: 13, fontWeight: active ? '600' : '500', color: active ? '#fff' : colors.textSecondary }}>
          {tag}
        </Text>
      </View>
    </Pressable>
  );
}

function DesignCard({
  item, size, colors, accent, onPress,
}: {
  item: DesignWithUrl; size: number; colors: any; accent: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        width: size, borderRadius: 18, overflow: 'hidden',
        backgroundColor: colors.surface,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
      }}>
        {item.signedUrl ? (
          <Image source={{ uri: item.signedUrl }} style={{ width: size, height: size, backgroundColor: colors.surface }} resizeMode="cover" />
        ) : (
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '12' }}>
            <Ionicons name="image-outline" size={32} color={accent} />
          </View>
        )}
        <View style={{ padding: 10, paddingTop: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }} numberOfLines={1}>
            {item.title}
          </Text>
          {item.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {item.tags.slice(0, 2).map((tag) => (
                <View key={tag} style={{ backgroundColor: accent + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, color: accent, fontWeight: '600' }}>{tag}</Text>
                </View>
              ))}
              {item.tags.length > 2 && (
                <Text style={{ fontSize: 10, color: colors.textTertiary, alignSelf: 'center' }}>+{item.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function GalleryScreen() {
  const { colors, accent } = useTheme();
  const { width } = useWindowDimensions();
  const cardSize = (width - H_PADDING * 2 - GAP) / NUM_COLUMNS;
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: designs = [], isLoading, isError, error, refetch, isFetching } = useGallery();

  const allTags = useMemo(() => {
    const set = new Set<string>();
    designs.forEach((d) => d.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [designs]);

  const filtered = useMemo(() => {
    if (!activeTag) return designs;
    return designs.filter((d) => d.tags.includes(activeTag));
  }, [designs, activeTag]);

  const rows = useMemo(() => {
    const result: (DesignWithUrl | null)[][] = [];
    for (let i = 0; i < filtered.length; i += NUM_COLUMNS) {
      result.push([filtered[i] ?? null, filtered[i + 1] ?? null]);
    }
    return result;
  }, [filtered]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Galería</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isFetching && !isLoading && <ActivityIndicator size="small" color={accent} />}
            <Pressable onPress={() => router.push('/gallery/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
            </Pressable>
          </View>
        </View>

        {designs.length > 0 && (
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}>
            {designs.length} diseño{designs.length !== 1 ? 's' : ''}
          </Text>
        )}

        {allTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
            <TagChip tag="Todos" active={activeTag === null} accent={accent} colors={colors} onPress={() => setActiveTag(null)} />
            {allTags.map((tag) => (
              <TagChip key={tag} tag={tag} active={activeTag === tag} accent={accent} colors={colors} onPress={() => setActiveTag(activeTag === tag ? null : tag)} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Contenido ── */}
      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 20 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' }}>Error al cargar la galería</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 16, textAlign: 'center' }}>
            {(error as Error)?.message ?? 'Intenta de nuevo'}
          </Text>
          <Pressable onPress={() => refetch()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Reintentar</Text>
            </View>
          </Pressable>
        </View>
      ) : designs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="images-outline" size={32} color={accent} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Sin diseños en la galería</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
            Sube el primer diseño para comenzar
          </Text>
          <Pressable onPress={() => router.push('/gallery/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ backgroundColor: accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Subir diseño</Text>
            </View>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Ionicons name="filter-outline" size={36} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Sin resultados</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>No hay diseños con ese tag</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item: row }) => (
            <View style={{ flexDirection: 'row', paddingHorizontal: H_PADDING, gap: GAP, marginBottom: GAP }}>
              {row.map((item, idx) =>
                item ? (
                  <DesignCard key={item.id} item={item} size={cardSize} colors={colors} accent={accent} onPress={() => router.push(`/gallery/${item.id}`)} />
                ) : (
                  <View key={`empty-${idx}`} style={{ width: cardSize }} />
                )
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
          onRefresh={refetch} refreshing={false}
          bounces
        />
      )}
    </SafeAreaView>
  );
}
