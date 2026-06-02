import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useTheme } from '@/hooks/useTheme';
import type { Branch } from '@/types';

function BranchCard({
  branch, onPress, colors, accent,
}: {
  branch: Branch; onPress: () => void; colors: any; accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, padding: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: accent + '20',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="storefront-outline" size={22} color={accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {branch.name}
        </Text>
        {branch.address ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }} numberOfLines={1}>
            {branch.address}
          </Text>
        ) : null}
        {branch.is_default && (
          <View style={{
            alignSelf: 'flex-start', marginTop: 4,
            backgroundColor: accent + '20', borderRadius: 6,
            paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: accent }}>Principal</Text>
          </View>
        )}
      </View>

      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: accent + '15',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="chevron-forward" size={18} color={accent} />
      </View>
    </Pressable>
  );
}

export default function BranchSelectScreen() {
  const { colors, accent } = useTheme();
  const { branches, isMulti } = useActiveBranch();
  const setActiveBranch = useAuthStore((s) => s.setActiveBranch);
  const isLoading = branches.length === 0;

  function handleSelect(branch: Branch) {
    setActiveBranch(branch.id);
    router.replace('/');
  }

  const activeBranches = branches.filter(b => b.is_active);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, backgroundColor: accent + '12' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        <View style={{ paddingTop: 56, paddingBottom: 36, alignItems: 'center' }}>
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: accent,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
          }}>
            <Ionicons name="storefront" size={30} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
            Selecciona la sucursal
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            {activeBranches.length} {activeBranches.length === 1 ? 'sucursal disponible' : 'sucursales disponibles'}
          </Text>
        </View>

        {activeBranches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onPress={() => handleSelect(branch)}
            colors={colors}
            accent={accent}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
