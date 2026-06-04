import {
  View, Text, Pressable, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/hooks/useBranches';
import { useToggleBranch } from '@/hooks/useBranchMutations';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Branch } from '@/types';

function BranchCard({
  branch, activeBranchId, onToggle, onSelect, onEdit, colors, accent,
}: {
  branch: Branch; activeBranchId: string | null;
  onToggle: () => void; onSelect: () => void; onEdit: () => void;
  colors: any; accent: string;
}) {
  const isActive = activeBranchId === branch.id;

  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, marginBottom: 12, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        {/* Franja superior */}
        <View style={{ height: 4, backgroundColor: isActive ? accent : accent + '30' }} />

        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Ícono */}
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: branch.is_active ? accent + '18' : colors.surface,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons
              name="storefront-outline"
              size={22}
              color={branch.is_active ? accent : colors.textTertiary}
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: branch.is_active ? colors.text : colors.textTertiary }}>
              {branch.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {branch.is_default && (
                <View style={{ backgroundColor: accent + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: accent }}>PRINCIPAL</Text>
                </View>
              )}
              {isActive && (
                <View style={{ backgroundColor: '#30D15818', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#30D158' }}>ACTIVA</Text>
                </View>
              )}
              {!branch.is_active && (
                <View style={{ backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textTertiary }}>INACTIVA</Text>
                </View>
              )}
            </View>
            {branch.address ? (
              <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                {branch.address}
              </Text>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>

        {/* Acciones rápidas */}
        {((!isActive && branch.is_active) || !branch.is_default) && (
          <View style={{
            flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14,
          }}>
            {!isActive && branch.is_active && (
              <Pressable
                onPress={onSelect}
                style={({ pressed }) => ({
                  flex: 1, height: 34, borderRadius: 10,
                  backgroundColor: accent + '18',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>Ir a esta</Text>
              </Pressable>
            )}
            {!branch.is_default && (
              <Pressable
                onPress={onToggle}
                style={({ pressed }) => ({
                  flex: 1, height: 34, borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: branch.is_active ? '#FF453A30' : colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: branch.is_active ? '#FF453A' : colors.textSecondary }}>
                  {branch.is_active ? 'Desactivar' : 'Activar'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function AdminBranchesScreen() {
  const { colors, accent } = useTheme();
  const { orgRole } = useActiveOrg();
  const { branchId } = useActiveBranch();
  const setActiveBranch = useAuthStore((s) => s.setActiveBranch);
  const { data: branches = [], isLoading } = useBranches();
  const toggleBranch = useToggleBranch();

  if (orgRole !== 'admin' && orgRole !== 'owner') return <Redirect href="/(app)/(tabs)" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Sucursales</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/branch/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        {isLoading ? (
          <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
        ) : branches.length === 0 ? (
          <Pressable onPress={() => router.push('/branch/new')} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View style={{
              backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 36,
              alignItems: 'center', marginTop: 20,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="storefront-outline" size={30} color={accent} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Sin sucursales</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                Toca aquí para agregar{'\n'}tu primera sucursal
              </Text>
              <View style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: accent, borderRadius: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nueva sucursal</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              activeBranchId={branchId}
              onEdit={() => router.push(`/branch/${branch.id}`)}
              onToggle={() => {
                Alert.alert(
                  branch.is_active ? 'Desactivar sucursal' : 'Activar sucursal',
                  `¿${branch.is_active ? 'Desactivar' : 'Activar'} "${branch.name}"?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: branch.is_active ? 'Desactivar' : 'Activar',
                      style: branch.is_active ? 'destructive' : 'default',
                      onPress: () => toggleBranch.mutate({ id: branch.id, is_active: !branch.is_active }),
                    },
                  ]
                );
              }}
              onSelect={() => { setActiveBranch(branch.id); router.back(); }}
              colors={colors}
              accent={accent}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
