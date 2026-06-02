import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCreateService } from '@/hooks/useServiceMutations';
import { Input } from '@/components/ui/Input';
import type { ServiceCategory } from '@/types';

const CATEGORIES: { value: ServiceCategory; label: string; emoji: string }[] = [
  { value: 'manicure', label: 'Manicure', emoji: '💅' },
  { value: 'pedicure', label: 'Pedicure', emoji: '🦶' },
  { value: 'gel', label: 'Gel', emoji: '✨' },
  { value: 'acrilico', label: 'Acrílico', emoji: '💎' },
  { value: 'otro', label: 'Otro', emoji: '🎨' },
];

const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180];

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

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

export default function NewServiceScreen() {
  const { colors, accent } = useTheme();
  const createService = useCreateService();

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [category, setCategory]       = useState<ServiceCategory>('manicure');
  const [durationMin, setDurationMin] = useState(60);
  const [appliesSurcharge, setAppliesSurcharge] = useState(false);

  const isValid = name.trim().length >= 2 && parseFloat(price) > 0;

  async function handleSave() {
    if (!isValid) return;

    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }

    try {
      const id = await createService.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        duration_min: durationMin,
        category,
        applies_surcharge: appliesSurcharge,
      });
      router.replace(`/service/${id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar el servicio');
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
              Nuevo servicio
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
            label="Nombre *"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Manicure clásica"
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <View style={{ height: 12 }} />

          <Input
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción opcional del servicio"
            multiline
            numberOfLines={3}
          />

          <SectionLabel label="Precio" colors={colors} />

          <Input
            label="Precio (MXN) *"
            value={price}
            onChangeText={setPrice}
            placeholder="Ej. 250"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          <SectionLabel label="Categoría" colors={colors} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const selected = category === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: selected ? accent + '20' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: selected ? accent : colors.border,
                  })}
                >
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: selected ? '700' : '500',
                    color: selected ? accent : colors.textSecondary,
                  }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel label="Duración" colors={colors} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DURATIONS.map((d) => {
              const selected = durationMin === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDurationMin(d)}
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
                    {formatDuration(d)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel label="Recargo fuera de horario" colors={colors} />

          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: colors.surfaceElevated, borderRadius: 16,
            paddingHorizontal: 16, paddingVertical: 14,
            borderWidth: 1.5, borderColor: appliesSurcharge ? accent : colors.border,
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                Aplica recargo
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {appliesSurcharge
                  ? 'Este servicio cobra recargo al agendarse fuera de horario'
                  : 'Sin recargo fuera de horario laboral'}
              </Text>
            </View>
            <Switch
              value={appliesSurcharge}
              onValueChange={setAppliesSurcharge}
              trackColor={{ false: colors.border, true: accent + '80' }}
              thumbColor={appliesSurcharge ? accent : colors.textTertiary}
            />
          </View>

          <Pressable
            onPress={handleSave}
            style={{ marginTop: 32, backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
          >
            {createService.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
