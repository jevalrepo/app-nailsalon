import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const { colors, accent } = useTheme();
  const primary = accent || '#F4A99A';
  const isDark = colors.background === '#000000';
  const labelColor = isDark ? '#D8C4BF' : '#8B7777';
  const fieldTextColor = isDark ? '#FFF7F4' : '#2F282A';
  const mutedColor = isDark ? '#B8A5A1' : '#A08D8D';
  const softBackground = isDark ? '#110F0F' : '#FFF8F6';

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setError('Correo o contraseña incorrectos.');
      return;
    }

    if (data.session) {
      useAuthStore.getState().setSession(data.session);
    }

    router.replace('/');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: softBackground }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: 360,
          backgroundColor: isDark ? '#211615' : '#FDEDEC',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 220,
          right: 0,
          left: 0,
          height: 180,
          backgroundColor: isDark ? '#181313' : '#FFF3F0',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
        >
          <View
            style={{
              paddingTop: 54,
              paddingBottom: 22,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: primary,
                shadowColor: primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 8,
                marginBottom: 20,
              }}
            >
              <Ionicons name="sparkles" size={42} color="#fff" />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: fieldTextColor, letterSpacing: -0.5 }}>
              Bienvenido
            </Text>
            <Text style={{ fontSize: 14, color: mutedColor, marginTop: 6 }}>
              Inicia sesión para continuar
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
            {error ? (
              <View
                style={{
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#FF453A12',
                  borderWidth: 1,
                  borderColor: '#FF453A30',
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="alert-circle-outline" size={20} color={colors.destructive} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.destructive }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 22 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: labelColor, marginBottom: 8 }}>
                Correo electrónico
              </Text>
              <View
                style={{
                  minHeight: 58,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons name="mail-outline" size={22} color={colors.textTertiary} />
                <TextInput
                  style={{ flex: 1, color: fieldTextColor, fontSize: 16, paddingVertical: 14 }}
                  placeholder="hola@ejemplo.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: labelColor, marginBottom: 8 }}>
                Contraseña
              </Text>
              <View
                style={{
                  minHeight: 58,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons name="lock-closed-outline" size={22} color={colors.textTertiary} />
                <TextInput
                  style={{ flex: 1, color: fieldTextColor, fontSize: 16, paddingVertical: 14 }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPass(v => !v)}
                  hitSlop={10}
                  accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={({ pressed }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.textTertiary}
                  />
                </Pressable>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
              accessibilityRole="button"
              style={{
                height: 58,
                marginTop: 24,
                borderRadius: 18,
                backgroundColor: primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                shadowColor: primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.28,
                shadowRadius: 16,
                elevation: 5,
                opacity: loading ? 0.82 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                    Iniciar sesión
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View
              style={{
                marginTop: 22,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={15} color={mutedColor} />
              <Text style={{ color: mutedColor, fontSize: 12 }}>
                Solo personal autorizado
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
