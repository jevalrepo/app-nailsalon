import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useDesignById } from '@/hooks/useGallery';
import { useDeleteDesign } from '@/hooks/useGalleryMutations';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useSyncContext } from '@/lib/sync/SyncProvider';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DesignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();
  const { isConnected } = useSyncContext();
  const { width } = useWindowDimensions();
  const { orgRole } = useActiveOrg();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const { data: design, isLoading, isError, error } = useDesignById(id!);
  const deleteDesign = useDeleteDesign();

  const [imageError, setImageError] = useState(false);

  const canDelete = isAdmin || design?.uploaded_by === profile?.id;

  function handleDelete() {
    if (!design) return;
    Alert.alert(
      'Eliminar diseño',
      '¿Seguro que deseas eliminar este diseño? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDesign.mutateAsync({
                id: design.id,
                imagePath: design.image_url,
              });
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} />
      </SafeAreaView>
    );
  }

  if (isError || !design) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {isError ? (error as Error)?.message : 'Diseño no encontrado'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
      >
        {/* ── Imagen hero ── */}
        <View style={{ position: 'relative' }}>
          {design.signedUrl && !imageError ? (
            <Image
              source={{ uri: design.signedUrl }}
              style={{ width, height: width, backgroundColor: colors.surface }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={{
              width, height: width,
              backgroundColor: accent + '12',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="image-outline" size={56} color={accent} />
            </View>
          )}

          {/* Botón volver flotante */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              position: 'absolute', top: 16, left: 16,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.45)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </View>
          </Pressable>

          {/* Botón eliminar flotante (si tiene permiso, solo online) */}
          {canDelete && (
            <Pressable
              onPress={isConnected ? handleDelete : undefined}
              style={({ pressed }) => ({
                position: 'absolute', top: 16, right: 16,
                opacity: !isConnected ? 0.35 : pressed ? 0.7 : 1,
              })}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 12,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {deleteDesign.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#FF453A" />
                )}
              </View>
            </Pressable>
          )}
        </View>

        {/* ── Info ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            {design.title}
          </Text>

          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
            Subido el {formatDate(design.created_at)}
          </Text>

          {/* Tags */}
          {design.tags.length > 0 && (
            <>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: colors.textSecondary,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                Tags
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {design.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: accent + '18',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: accent, fontWeight: '600' }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {design.tags.length === 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              gap: 6, paddingVertical: 8,
            }}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textTertiary} />
              <Text style={{ fontSize: 13, color: colors.textTertiary }}>Sin tags</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
