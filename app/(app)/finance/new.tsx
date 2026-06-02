import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCreateTransaction } from '@/hooks/useFinanceMutations';
import { Input } from '@/components/ui/Input';

const INCOME_CATEGORIES = [
  'Servicio', 'Propina', 'Venta producto', 'Otro',
];
const EXPENSE_CATEGORIES = [
  'Insumos', 'Equipo', 'Renta', 'Servicios', 'Publicidad', 'Otro',
];
const PAYMENT_METHODS: { value: 'cash' | 'card' | 'transfer'; label: string; icon: string }[] = [
  { value: 'cash',     label: 'Efectivo',    icon: 'cash-outline' },
  { value: 'card',     label: 'Tarjeta',     icon: 'card-outline' },
  { value: 'transfer', label: 'Transferencia', icon: 'swap-horizontal-outline' },
];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.5, textTransform: 'uppercase',
      marginTop: 20, marginBottom: 10,
    }}>
      {label}
    </Text>
  );
}

type TxType = 'income' | 'expense';

export default function NewTransactionScreen() {
  const { colors, accent } = useTheme();
  const createTx = useCreateTransaction();

  const [txType, setTxType]     = useState<TxType>('income');
  const [amount, setAmount]     = useState('');
  const [description, setDesc]  = useState('');
  const [category, setCategory] = useState('Servicio');
  const [method, setMethod]     = useState<'cash' | 'card' | 'transfer'>('cash');
  const [date, setDate]         = useState(todayISO());

  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function switchType(t: TxType) {
    setTxType(t);
    setCategory(t === 'income' ? 'Servicio' : 'Insumos');
  }

  const isValid = description.trim().length >= 2 && parseFloat(amount) > 0;

  async function handleSave() {
    if (!isValid) return;
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Error', 'Formato de fecha: YYYY-MM-DD');
      return;
    }
    try {
      const id = await createTx.mutateAsync({
        type: txType,
        amount: amountNum,
        description: description.trim(),
        category,
        payment_method: method,
        date,
      });
      router.replace(`/finance/${id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  }

  const incomeActive  = txType === 'income';
  const expenseActive = txType === 'expense';

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
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              Nuevo movimiento
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Selector tipo */}
          <SectionLabel label="Tipo" colors={colors} />
          <View style={{
            flexDirection: 'row', gap: 10,
            backgroundColor: colors.surface,
            borderRadius: 16, padding: 4,
          }}>
            <Pressable
              onPress={() => switchType('income')}
              style={({ pressed }) => ({
                flex: 1, alignItems: 'center', justifyContent: 'center',
                paddingVertical: 12, borderRadius: 12,
                backgroundColor: incomeActive ? '#30D15820' : 'transparent',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{
                fontSize: 14, fontWeight: '700',
                color: incomeActive ? '#30D158' : colors.textSecondary,
              }}>
                Ingreso
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchType('expense')}
              style={({ pressed }) => ({
                flex: 1, alignItems: 'center', justifyContent: 'center',
                paddingVertical: 12, borderRadius: 12,
                backgroundColor: expenseActive ? '#FF453A20' : 'transparent',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{
                fontSize: 14, fontWeight: '700',
                color: expenseActive ? '#FF453A' : colors.textSecondary,
              }}>
                Egreso
              </Text>
            </Pressable>
          </View>

          {/* Monto */}
          <SectionLabel label="Monto" colors={colors} />
          <Input
            label="Monto (MXN) *"
            value={amount}
            onChangeText={setAmount}
            placeholder="Ej. 350"
            keyboardType="decimal-pad"
            returnKeyType="next"
          />

          {/* Descripción */}
          <SectionLabel label="Descripción" colors={colors} />
          <Input
            label="Descripción *"
            value={description}
            onChangeText={setDesc}
            placeholder="Ej. Manicure gel clienta López"
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          {/* Categoría */}
          <SectionLabel label="Categoría" colors={colors} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => {
              const selected = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: selected ? accent + '20' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: selected ? accent : colors.border,
                  })}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: selected ? '700' : '500',
                    color: selected ? accent : colors.textSecondary,
                  }}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Método de pago */}
          <SectionLabel label="Método de pago" colors={colors} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {PAYMENT_METHODS.map((pm) => {
              const selected = method === pm.value;
              return (
                <Pressable
                  key={pm.value}
                  onPress={() => setMethod(pm.value)}
                  style={({ pressed }) => ({
                    flex: 1, alignItems: 'center', justifyContent: 'center',
                    gap: 6, paddingVertical: 12, borderRadius: 14,
                    backgroundColor: selected ? accent + '20' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: selected ? accent : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons
                    name={pm.icon as any}
                    size={20}
                    color={selected ? accent : colors.textSecondary}
                  />
                  <Text style={{
                    fontSize: 11, fontWeight: selected ? '700' : '500',
                    color: selected ? accent : colors.textSecondary,
                    textAlign: 'center',
                  }}>
                    {pm.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Fecha */}
          <SectionLabel label="Fecha" colors={colors} />
          <Input
            label="Fecha (YYYY-MM-DD) *"
            value={date}
            onChangeText={setDate}
            placeholder="2025-05-29"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />

          <Pressable
            onPress={handleSave}
            style={{ marginTop: 32, backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
          >
            {createTx.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
