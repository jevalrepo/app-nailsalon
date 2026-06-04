import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useBranches } from '@/hooks/useBranches';
import { useUpdateBranch } from '@/hooks/useBranchMutations';
import { Input } from '@/components/ui/Input';

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10,
    }}>
      {label}
    </Text>
  );
}

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();
  const { data: branches = [] } = useBranches();
  const updateBranch = useUpdateBranch();

  const branch = branches.find(b => b.id === id);

  const [name, setName]       = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone]     = useState('');

  useEffect(() => {
    if (!branch) return;
    setName(branch.name);
    setAddress(branch.address ?? '');
    setPhone(branch.phone ?? '');
  }, [branch]);

  const hasChanges = branch && (
    name.trim() !== branch.name ||
    address.trim() !== (branch.address ?? '') ||
    phone.trim() !== (branch.phone ?? '')
  );

  async function handleSave() {
    if (!branch || !name.trim()) return;
    try {
      await updateBranch.mutateAsync({ id: branch.id, name: name.trim(), address: address.trim(), phone: phone.trim() });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  }

  if (!branch) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{branch.name}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel label="Información" colors={colors} />

          <Input
            label="Nombre de la sucursal *"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Sucursal Centro"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Input
            label="Dirección"
            value={address}
            onChangeText={setAddress}
            placeholder="Calle, número, colonia"
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <Input
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            placeholder="55 1234 5678"
            keyboardType="phone-pad"
            returnKeyType="done"
          />
        </ScrollView>

        {/* Botón fijo */}
        {hasChanges && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
            <Pressable
              onPress={handleSave}
              disabled={updateBranch.isPending}
              style={{ marginTop: 8, backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
            >
              {updateBranch.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar cambios</Text>
              }
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
