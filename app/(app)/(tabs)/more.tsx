import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase',
      marginBottom: 8, paddingHorizontal: 4,
    }}>
      {label}
    </Text>
  );
}

function MenuRow({
  icon, label, value, onPress, destructive = false, colors, accent,
}: {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  colors: any;
  accent: string;
}) {
  const iconBg    = destructive ? '#FF453A18' : accent + '18';
  const iconColor = destructive ? '#FF453A' : accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.7 : 1 })}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 13, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: colors.borderLight,
      }}>
        <View style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <Text style={{
          flex: 1, fontSize: 15, fontWeight: '500',
          color: destructive ? '#FF453A' : colors.text,
        }}>
          {label}
        </Text>
        {value ? (
          <Text style={{ fontSize: 13, color: colors.textTertiary }}>{value}</Text>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        ) : (
          <Text style={{
            fontSize: 11, fontWeight: '600', color: colors.textTertiary,
            backgroundColor: colors.surface, borderRadius: 6,
            paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden',
          }}>
            Próximo
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function MenuSection({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <SectionLabel label={label} colors={colors} />
      <View style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const { colors, accent } = useTheme();
  const { profile, clear } = useAuthStore();

  async function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás segura de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            clear();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }

  const roleLabel = profile?.role === 'admin' ? 'Administrador' : 'Empleada';

  // Elimina el separador del último item en cada sección
  const noBottomBorder = { borderBottomWidth: 0 };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 32 }}
      >

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Más</Text>
        </View>

        {/* ── Perfil ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: accent + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="person" size={24} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                {profile?.full_name ?? 'Usuario'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {roleLabel}
              </Text>
            </View>
            <View style={{
              backgroundColor: accent + '18', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>
                {profile?.role === 'admin' ? 'Admin' : 'Staff'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Gestión ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <MenuSection label="Gestión" colors={colors}>
            <MenuRow icon="cut-outline"            label="Servicios"          onPress={() => router.push('/service')}    colors={colors} accent={accent} />
            <MenuRow icon="cube-outline"           label="Inventario"         onPress={() => router.push('/inventory')}  colors={colors} accent={accent} />
            <MenuRow icon="images-outline"         label="Galería de diseños" onPress={() => router.push('/gallery')}    colors={colors} accent={accent} />
            <MenuRow icon="checkmark-done-outline" label="Tareas"             onPress={() => router.push('/task')}       colors={colors} accent={accent} />
            <View style={noBottomBorder}>
              <MenuRow icon="bar-chart-outline"    label="Estadísticas"       onPress={() => router.push('/stats')}      colors={colors} accent={accent} />
            </View>
          </MenuSection>

          {/* ── Admin ── */}
          {profile?.role === 'admin' && (
            <MenuSection label="Administración" colors={colors}>
              <MenuRow icon="people-outline"           label="Empleadas"               onPress={() => router.push('/employee')} colors={colors} accent={accent} />
              <MenuRow icon="wallet-outline"           label="Finanzas"                onPress={() => router.push('/finance')}  colors={colors} accent={accent} />
              <View style={noBottomBorder}>
                <MenuRow icon="shield-checkmark-outline" label="Panel de administración" onPress={() => router.push('/admin')} colors={colors} accent={accent} />
              </View>
            </MenuSection>
          )}

          {/* ── Configuración ── */}
          <MenuSection label="Configuración" colors={colors}>
            <View style={noBottomBorder}>
              <MenuRow icon="settings-outline" label="Perfil y preferencias" onPress={() => router.push('/profile')} colors={colors} accent={accent} />
            </View>
          </MenuSection>

          {/* ── Sesión ── */}
          <MenuSection label="Sesión" colors={colors}>
            <View style={noBottomBorder}>
              <MenuRow
                icon="log-out-outline"
                label="Cerrar sesión"
                onPress={handleLogout}
                destructive
                colors={colors}
                accent={accent}
              />
            </View>
          </MenuSection>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
