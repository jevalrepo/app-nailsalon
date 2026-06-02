import {
  View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useBusinessConfig, useUpdateBusinessConfig } from '@/hooks/useBusinessConfig';
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
  const { orgRole } = useActiveOrg();

  const [form, setForm] = useState<Pick<BusinessConfig, 'business_name' | 'phone' | 'address' | 'instagram_handle'>>({
    business_name: 'Coraline Nails',
    phone: '', address: '', instagram_handle: '',
  });
  const [dirty, setDirty] = useState(false);

  if (orgRole !== 'admin' && orgRole !== 'owner') return <Redirect href="/(app)/(tabs)" />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (remoteConfig) {
      setForm({
        business_name: remoteConfig.business_name,
        phone: remoteConfig.phone,
        address: remoteConfig.address,
        instagram_handle: remoteConfig.instagram_handle,
      });
      setDirty(false);
    }
  }, [remoteConfig]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync(form);
      setDirty(false);
      Alert.alert('Guardado', 'Datos del negocio guardados correctamente.');
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
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flex: 1 })}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Datos del negocio</Text>
        </Pressable>
        {dirty && (
          <Pressable
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={({ pressed }) => ({
              backgroundColor: accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
              opacity: pressed || updateMutation.isPending ? 0.7 : 1,
            })}
          >
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Guardar</Text>
            }
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <SectionTitle label="Información del negocio" colors={colors} />
          <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Field label="Nombre del negocio" value={form.business_name} onChangeText={v => update('business_name', v)} placeholder="Ej. Coraline Nails" colors={colors} accent={accent} />
            <Field label="Teléfono" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+52 33 1234 5678" keyboardType="phone-pad" colors={colors} accent={accent} />
            <Field label="Dirección" value={form.address} onChangeText={v => update('address', v)} placeholder="Calle, colonia, ciudad" colors={colors} accent={accent} />
            <Field label="Instagram" value={form.instagram_handle} onChangeText={v => update('instagram_handle', v)} placeholder="nombre_del_negocio" colors={colors} accent={accent} prefix="@" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
