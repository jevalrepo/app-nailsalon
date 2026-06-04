import {
  View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useBusinessConfig, useUpdateBusinessConfig } from '@/hooks/useBusinessConfig';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { useCachedLogoUri } from '@/hooks/useCachedLogoUri';
import type { BusinessConfig } from '@/hooks/useBusinessConfig';

function SectionTitle({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 4,
    }}>
      {label}
    </Text>
  );
}

function Field({
  label, value, onChangeText, placeholder, colors, accent,
  keyboardType = 'default', prefix,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; colors: any; accent: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: focused ? accent : colors.border,
        borderRadius: 12, backgroundColor: colors.surface, paddingHorizontal: 12,
      }}>
        {prefix && <Text style={{ fontSize: 14, color: colors.textSecondary, marginRight: 4 }}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? ''}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
        />
      </View>
    </View>
  );
}

export default function AdminBusinessScreen() {
  const { colors, accent } = useTheme();
  const { data: remoteConfig, isLoading } = useBusinessConfig();
  const updateMutation = useUpdateBusinessConfig();
  const { orgRole, org } = useActiveOrg();
  const {
    pickLogo,
    markLogoForRemoval,
    savePendingLogo,
    isUploading,
    logoPreviewUri,
    logoDirty,
    logoMarkedForRemoval,
  } = useLogoUpload();
  const cachedLogoUri = useCachedLogoUri(org?.id, org?.logo_url);

  type FormData = Pick<BusinessConfig, 'business_name' | 'phone' | 'address' | 'instagram_handle'>;

  const [form, setForm] = useState<FormData>({ business_name: '', phone: '', address: '', instagram_handle: '' });
  const [original, setOriginal] = useState<FormData>({ business_name: '', phone: '', address: '', instagram_handle: '' });

  useEffect(() => {
    if (remoteConfig) {
      const loaded: FormData = {
        business_name: remoteConfig.business_name ?? '',
        phone: remoteConfig.phone ?? '',
        address: remoteConfig.address ?? '',
        instagram_handle: remoteConfig.instagram_handle ?? '',
      };
      setForm(loaded);
      setOriginal(loaded);
    }
  }, [remoteConfig]);

  const formDirty = !remoteConfig ? false : (
    form.business_name.trim() !== (remoteConfig.business_name ?? '').trim() ||
    form.phone.trim() !== (remoteConfig.phone ?? '').trim() ||
    form.address.trim() !== (remoteConfig.address ?? '').trim() ||
    form.instagram_handle.trim() !== (remoteConfig.instagram_handle ?? '').trim()
  );
  const dirty = formDirty || logoDirty;
  const logoUri = logoMarkedForRemoval ? null : logoPreviewUri ?? cachedLogoUri ?? org?.logo_url ?? null;

  if (orgRole !== 'admin' && orgRole !== 'owner') return <Redirect href="/(app)/(tabs)" />;

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      if (formDirty) {
        await updateMutation.mutateAsync(form);
      }
      if (logoDirty) {
        await savePendingLogo();
      }
      setOriginal(form);
      if (formDirty) {
        Alert.alert('Guardado', 'Datos del negocio guardados correctamente.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar.');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Datos del negocio</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

          {/* Logo */}
          <View style={{ marginTop: 8, marginBottom: 24 }}>
            <SectionTitle label="Logo del salón" colors={colors} />
            <View style={{
              backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 20,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
              alignItems: 'center', gap: 16,
            }}>
              <View style={{ position: 'relative' }}>
                <View style={{
                  width: 100, height: 100, borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 2, borderColor: colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {logoUri ? (
                    <Image key={logoUri} source={{ uri: logoUri }} style={{ width: 100, height: 100 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="sparkles" size={38} color={accent} />
                  )}
                  {isUploading && (
                    <View style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </View>
                {logoUri && !isUploading && (
                  <Pressable
                    onPress={() => Alert.alert('Eliminar logo', '¿Quitar el logo del salón?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => markLogoForRemoval() },
                    ])}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 26, height: 26, borderRadius: 13,
                      backgroundColor: '#FF453A',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={async () => {
                  try {
                    await pickLogo();
                  } catch {
                    Alert.alert('Error', 'No se pudo seleccionar el logo.');
                  }
                }}
                disabled={isUploading}
                style={{
                  marginTop: 4,
                  backgroundColor: accent,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                  {logoUri ? 'Cambiar logo' : 'Subir logo'}
                </Text>
              </Pressable>

            </View>
          </View>

          {/* Información */}
          <View style={{ marginBottom: 24 }}>
            <SectionTitle label="Información del negocio" colors={colors} />
            <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <Field label="Nombre del negocio" value={form.business_name} onChangeText={v => update('business_name', v)} placeholder="Ej. Coraline Nails" colors={colors} accent={accent} />
              <Field label="Teléfono" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+52 33 1234 5678" keyboardType="phone-pad" colors={colors} accent={accent} />
              <Field label="Dirección" value={form.address} onChangeText={v => update('address', v)} placeholder="Calle, colonia, ciudad" colors={colors} accent={accent} />
              <Field label="Instagram" value={form.instagram_handle} onChangeText={v => update('instagram_handle', v)} placeholder="nombre_del_negocio" colors={colors} accent={accent} prefix="@" />
            </View>
          </View>
        </ScrollView>

        {/* Botón fijo */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
          <Pressable
            onPress={handleSave}
            disabled={!dirty || updateMutation.isPending || isUploading}
            style={{
              marginTop: 8,
              backgroundColor: dirty ? '#F4A99A' : colors.border,
              borderRadius: 16, paddingVertical: 18, alignItems: 'center',
            }}
          >
            {updateMutation.isPending || isUploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: dirty ? '#fff' : colors.textSecondary, fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
