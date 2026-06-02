import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCreateInventoryItem } from '@/hooks/useInventoryMutations';
import { Input } from '@/components/ui/Input';

const UNITS = ['piezas', 'ml', 'gr', 'litros', 'kg', 'cajas', 'pares', 'rollos'];

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

export default function NewInventoryScreen() {
  const { colors, accent } = useTheme();
  const createItem = useCreateInventoryItem();

  const [name, setName]           = useState('');
  const [quantity, setQuantity]   = useState('');
  const [unit, setUnit]           = useState('piezas');
  const [minStock, setMinStock]   = useState('');

  const isValid =
    name.trim().length >= 2 &&
    parseFloat(quantity) >= 0;

  async function handleSave() {
    if (!isValid) return;

    const qty = parseFloat(quantity.replace(',', '.'));
    const min = parseFloat((minStock || '0').replace(',', '.'));

    if (isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    try {
      const id = await createItem.mutateAsync({
        name: name.trim(),
        quantity: qty,
        unit,
        min_stock: isNaN(min) ? 0 : min,
      });
      router.replace(`/inventory/${id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar el producto');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              Nuevo producto
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel label="Información básica" colors={colors} />

          <Input
            label="Nombre del producto *"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Esmalte gel rosa"
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <SectionLabel label="Stock actual" colors={colors} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Cantidad *"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Stock mínimo"
                value={minStock}
                onChangeText={setMinStock}
                placeholder="0"
                keyboardType="decimal-pad"
                returnKeyType="done"
                helper="Alerta de bajo stock"
              />
            </View>
          </View>

          <SectionLabel label="Unidad de medida" colors={colors} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {UNITS.map((u) => {
              const selected = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: selected ? accent + '20' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: selected ? accent : colors.border,
                  })}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: selected ? '700' : '500',
                    color: selected ? accent : colors.textSecondary,
                  }}>
                    {u}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tip: alerta de stock */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            backgroundColor: accent + '12',
            borderRadius: 14,
            padding: 14,
            marginTop: 24,
          }}>
            <Ionicons name="information-circle-outline" size={18} color={accent} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
              Si el stock cae por debajo del mínimo, aparecerá una alerta en el listado.
              Deja el mínimo en 0 para desactivar la alerta.
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            style={{ marginTop: 32, backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
          >
            {createItem.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
