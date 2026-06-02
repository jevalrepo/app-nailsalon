import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useUploadDesign } from '@/hooks/useGalleryMutations';
import { useSyncContext } from '@/lib/sync/SyncProvider';
import { Input } from '@/components/ui/Input';

// Tags predefinidos para uñas
const PRESET_TAGS = [
  'manicure', 'pedicure', 'gel', 'acrílico', 'nail art',
  'francés', 'ombre', 'glitter', 'flores', 'geométrico',
  'minimalista', 'degradado', 'stamping', 'temporada',
];

function TagPill({
  tag,
  active,
  accent,
  colors,
  onPress,
}: {
  tag: string;
  active: boolean;
  accent: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? accent : colors.surface,
        borderWidth: 1,
        borderColor: active ? accent : colors.border,
        margin: 3,
      }}>
        <Text style={{
          fontSize: 13,
          fontWeight: active ? '600' : '400',
          color: active ? '#fff' : colors.textSecondary,
        }}>
          {active ? '✓ ' : ''}{tag}
        </Text>
      </View>
    </Pressable>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 10,
    }}>
      {label}
    </Text>
  );
}

export default function NewDesignScreen() {
  const { colors, accent } = useTheme();
  const upload = useUploadDesign();
  const { isConnected } = useSyncContext();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [customTag, setCustomTag] = useState('');

  const isValid = imageUri !== null && title.trim().length >= 2;

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a tu galería para subir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  function showPickerOptions() {
    Alert.alert('Seleccionar foto', '', [
      { text: 'Cámara', onPress: pickFromCamera },
      { text: 'Galería', onPress: pickFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function addCustomTag() {
    const t = customTag.trim().toLowerCase();
    if (t.length < 2) return;
    setSelectedTags((prev) => new Set(prev).add(t));
    setCustomTag('');
  }

  async function handleSave() {
    if (!isValid || !imageUri) return;
    try {
      const id = await upload.mutateAsync({
        localUri: imageUri,
        title: title.trim(),
        tags: Array.from(selectedTags),
      });
      router.replace(`/gallery/${id}`);
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Intenta de nuevo');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              Nuevo diseño
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Foto ── */}
          <SectionLabel label="Foto" colors={colors} />
          <Pressable onPress={showPickerOptions} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{
              height: 220,
              borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderStyle: imageUri ? 'solid' : 'dashed',
              borderColor: imageUri ? accent : colors.border,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {imageUri ? (
                <>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <View style={{
                    position: 'absolute', bottom: 10, right: 10,
                    backgroundColor: accent,
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Cambiar</Text>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: accent + '18',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="camera-outline" size={26} color={accent} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                    Toca para seleccionar
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                    Cámara o galería
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* ── Título ── */}
          <SectionLabel label="Título" colors={colors} />
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Nail art floral primavera"
            label=""
            autoCapitalize="sentences"
            returnKeyType="done"
            maxLength={80}
          />

          {/* ── Tags ── */}
          <SectionLabel label="Tags (opcional)" colors={colors} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 }}>
            {PRESET_TAGS.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                active={selectedTags.has(tag)}
                accent={accent}
                colors={colors}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          {/* Tags personalizados activos */}
          {Array.from(selectedTags)
            .filter((t) => !PRESET_TAGS.includes(t))
            .map((tag) => (
              <View key={tag} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <TagPill
                  tag={tag}
                  active
                  accent={accent}
                  colors={colors}
                  onPress={() => toggleTag(tag)}
                />
              </View>
            ))}

          {/* Input tag personalizado */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            gap: 8, marginTop: 12,
          }}>
            <View style={{
              flex: 1,
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 14, paddingHorizontal: 12,
              height: 44, borderWidth: 1, borderColor: colors.border,
            }}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textTertiary} />
              <TextInput
                value={customTag}
                onChangeText={setCustomTag}
                placeholder="Tag personalizado..."
                placeholderTextColor={colors.placeholder}
                style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.text }}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={addCustomTag}
              />
            </View>
            <Pressable
              onPress={addCustomTag}
              disabled={customTag.trim().length < 2}
              style={({ pressed }) => ({ opacity: pressed || customTag.trim().length < 2 ? 0.5 : 1 })}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
            </Pressable>
          </View>

          {!isConnected && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 12 }}>
              Se requiere conexión para subir fotos
            </Text>
          )}
          <Pressable
            onPress={isConnected ? handleSave : undefined}
            style={{ marginTop: 8, backgroundColor: isConnected ? '#F4A99A' : colors.border, borderRadius: 16, paddingVertical: 18, alignItems: 'center', opacity: isConnected ? 1 : 0.5 }}
          >
            {upload.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: isConnected ? '#fff' : colors.textSecondary, fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
