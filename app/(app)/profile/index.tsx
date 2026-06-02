import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useThemeStore } from '@/stores/useThemeStore';
import { useTheme } from '@/hooks/useTheme';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { ACCENT_COLORS, type AccentColor } from '@/constants/colors';
import type { ColorScheme } from '@/constants/theme';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ label, colors }: { label: string; colors: any }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingHorizontal: 4,
      }}
    >
      {label}
    </Text>
  );
}

function Card({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 24,
      }}
    >
      {children}
    </View>
  );
}

// ── Appearance section ───────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ColorScheme; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'light', label: 'Claro',   icon: 'sunny-outline' },
  { value: 'dark',  label: 'Oscuro',  icon: 'moon-outline' },
  { value: 'system',label: 'Sistema', icon: 'phone-portrait-outline' },
];

const ACCENT_LABELS: Record<AccentColor, string> = {
  coral:    'Coral',
  lavender: 'Lavanda',
  blush:    'Blush',
  mint:     'Menta',
  sky:      'Cielo',
  peach:    'Durazno',
};

function AppearanceSection() {
  const { colors, accentColor, accent } = useTheme();
  const { colorScheme, setColorScheme, setAccentColor } = useThemeStore();

  return (
    <View>
      <SectionTitle label="Apariencia" colors={colors} />
      <Card colors={colors}>
        {/* Theme selector */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 12 }}>
            Tema
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {THEME_OPTIONS.map((opt) => {
              const active = colorScheme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setColorScheme(opt.value)}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: active ? accent : colors.border,
                    backgroundColor: active ? accent + '14' : colors.surface,
                    opacity: pressed ? 0.75 : 1,
                    gap: 6,
                  })}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? accent : colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: active ? '600' : '400',
                      color: active ? accent : colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Accent color selector */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 12 }}>
            Color de acento
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
              const hex    = ACCENT_COLORS[key];
              const active = accentColor === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setAccentColor(key)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    gap: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: active ? 3 : 2,
                      borderColor: active ? hex : colors.border,
                      shadowColor: hex,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: active ? 0.45 : 0,
                      shadowRadius: 6,
                      elevation: active ? 4 : 0,
                    }}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: active ? '600' : '400',
                      color: active ? hex : colors.textTertiary,
                    }}
                  >
                    {ACCENT_LABELS[key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>
    </View>
  );
}

// ── Personal info section ────────────────────────────────────────────────────

function PersonalInfoSection() {
  const { colors, accent } = useTheme();
  const { profile, setProfile } = useAuthStore();

  const [name,    setName]    = useState(profile?.full_name ?? '');
  const [phone,   setPhone]   = useState(profile?.phone ?? '');
  const [saving,  setSaving]  = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile?.id]);

  async function handleSave() {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', profile.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } else {
      setProfile({ ...profile, full_name: name.trim(), phone: phone.trim() || null });
      Alert.alert('¡Listo!', 'Tu perfil se actualizó correctamente.');
    }
  }

  function inputBorder(field: string) {
    return focused === field ? accent : colors.border;
  }

  return (
    <View>
      <SectionTitle label="Información personal" colors={colors} />
      <Card colors={colors}>
        <View style={{ padding: 16, gap: 16 }}>
          {/* Nombre */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
              Nombre completo
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: inputBorder('name'),
                paddingHorizontal: 14,
                minHeight: 50,
              }}
            >
              <Ionicons name="person-outline" size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                placeholder="Tu nombre"
                placeholderTextColor={colors.placeholder}
                style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
              />
            </View>
          </View>

          {/* Teléfono */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
              Teléfono
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: inputBorder('phone'),
                paddingHorizontal: 14,
                minHeight: 50,
              }}
            >
              <Ionicons name="call-outline" size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                placeholder="Número de teléfono"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
              />
            </View>
          </View>

        </View>
      </Card>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={{ marginBottom: 24, backgroundColor: accent || '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Guardar cambios</Text>
        }
      </Pressable>
    </View>
  );
}

// ── Change password section ──────────────────────────────────────────────────

function ChangePasswordSection() {
  const { colors, accent } = useTheme();

  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  async function handleChange() {
    if (!next.trim() || next.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message ?? 'No se pudo cambiar la contraseña.');
    } else {
      setCurrent(''); setNext(''); setConfirm('');
      Alert.alert('¡Listo!', 'Tu contraseña se cambió correctamente.');
    }
  }

  function inputBorder(field: string) {
    return focused === field ? accent : colors.border;
  }

  function PasswordField({
    label, value, onChangeText, placeholder, show, onToggle, field,
  }: {
    label: string; value: string; onChangeText: (v: string) => void;
    placeholder: string; show: boolean; onToggle: () => void; field: string;
  }) {
    return (
      <View>
        <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
          {label}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: inputBorder(field),
            paddingHorizontal: 14,
            minHeight: 50,
          }}
        >
          <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(field)}
            onBlur={() => setFocused(null)}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!show}
            style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
          />
          <Pressable onPress={onToggle} hitSlop={8}>
            <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: '500' }}>
              {show ? 'Ocultar' : 'Ver'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const canSave = next.length >= 6 && next === confirm;

  return (
    <View>
      <SectionTitle label="Seguridad" colors={colors} />
      <Card colors={colors}>
        <View style={{ padding: 16, gap: 14 }}>
          <PasswordField
            label="Contraseña actual"
            value={current}
            onChangeText={setCurrent}
            placeholder="••••••••"
            show={showCur}
            onToggle={() => setShowCur(v => !v)}
            field="current"
          />
          <PasswordField
            label="Nueva contraseña"
            value={next}
            onChangeText={setNext}
            placeholder="Mínimo 6 caracteres"
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
            field="new"
          />
          <PasswordField
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite la nueva contraseña"
            show={showConf}
            onToggle={() => setShowConf(v => !v)}
            field="confirm"
          />

          <Pressable
            onPress={handleChange}
            disabled={saving || !canSave}
            style={({ pressed }) => ({
              backgroundColor: canSave ? accent : colors.surface,
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: 'center',
              borderWidth: canSave ? 0 : 1,
              borderColor: colors.border,
              opacity: saving ? 0.6 : !canSave ? 0.5 : pressed ? 0.82 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color={canSave ? '#fff' : colors.textTertiary} size="small" />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: canSave ? '#fff' : colors.textTertiary,
                }}
              >
                Cambiar contraseña
              </Text>
            )}
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

// ── Avatar hero with photo upload ────────────────────────────────────────────

function AvatarHero() {
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const { pickAndUpload, removeAvatar, uploading, error } = useAvatarUpload();

  const initials = profile?.full_name ? getInitials(profile.full_name) : '?';
  const hasPhoto = !!profile?.avatar_url;

  function handlePress() {
    if (uploading) return;
    if (hasPhoto) {
      Alert.alert('Foto de perfil', 'Elige una opción', [
        { text: 'Cambiar foto', onPress: () => pickAndUpload() },
        {
          text: 'Eliminar foto',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Eliminar foto', '¿Segura de que quieres eliminar tu foto?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => removeAvatar() },
            ]),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      pickAndUpload();
    }
  }

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.8 : 1 })}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 30,
          marginBottom: 10,
          borderWidth: 3,
          borderColor: accent + '50',
          overflow: 'hidden',
          backgroundColor: accent + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasPhoto ? (
          <Image
            source={{ uri: profile!.avatar_url! }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 32, fontWeight: '700', color: accent }}>
            {initials}
          </Text>
        )}

        {/* Overlay de cámara */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 28,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="camera" size={14} color="#fff" />
          }
        </View>
      </View>

      <Text style={{ fontSize: 12, color: colors.textTertiary }}>
        {uploading ? 'Subiendo…' : hasPhoto ? 'Cambiar foto' : 'Agregar foto'}
      </Text>
    </Pressable>
  );
}

// ── Root screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const { orgRole } = useActiveOrg();

  const roleLabel = orgRole === 'owner' ? 'Propietario' : orgRole === 'admin' ? 'Administrador' : 'Empleada';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flex: 1 })}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
              Perfil y preferencias
            </Text>
          </Pressable>
        </View>

        {/* ── Avatar hero ── */}
        <View style={{ alignItems: 'center', paddingBottom: 28 }}>
          <AvatarHero />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 10 }}>
            {profile?.full_name ?? 'Usuario'}
          </Text>
          <View
            style={{
              marginTop: 6,
              backgroundColor: accent + '18',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: accent }}>
              {roleLabel}
            </Text>
          </View>
          {profile?.phone ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>
              {profile.phone}
            </Text>
          ) : null}
        </View>

        {/* ── Sections ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <AppearanceSection />
          <PersonalInfoSection />
          <ChangePasswordSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
