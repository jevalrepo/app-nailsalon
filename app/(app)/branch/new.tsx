import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCreateBranch } from '@/hooks/useBranchMutations';
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

export default function NewBranchScreen() {
  const { colors, accent } = useTheme();
  const createBranch = useCreateBranch();

  const [name, setName]       = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone]     = useState('');

  const isValid = name.trim().length >= 2;

  async function handleSave() {
    if (!isValid) return;
    try {
      await createBranch.mutateAsync({ name: name.trim(), address: address.trim(), phone: phone.trim() });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la sucursal');
    }
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
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Nueva sucursal</Text>
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
          />
        </ScrollView>

        {/* Botón fijo */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
          <Pressable
            onPress={handleSave}
            disabled={!isValid || createBranch.isPending}
            style={{
              marginTop: 8,
              backgroundColor: isValid ? '#F4A99A' : colors.border,
              borderRadius: 16, paddingVertical: 18, alignItems: 'center',
            }}
          >
            {createBranch.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: isValid ? '#fff' : colors.textSecondary, fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
