import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionById } from '@/hooks/useFinance';
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useFinanceMutations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const INCOME_CATEGORIES  = ['Servicio', 'Propina', 'Venta producto', 'Otro'];
const EXPENSE_CATEGORIES = ['Insumos', 'Equipo', 'Renta', 'Servicios', 'Publicidad', 'Otro'];

const PAYMENT_METHODS: { value: 'cash' | 'card' | 'transfer'; label: string; icon: string }[] = [
  { value: 'cash',     label: 'Efectivo',       icon: 'cash-outline' },
  { value: 'card',     label: 'Tarjeta',         icon: 'card-outline' },
  { value: 'transfer', label: 'Transferencia',   icon: 'swap-horizontal-outline' },
];

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

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

type TxType = 'income' | 'expense';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();

  const { data: tx, isLoading } = useTransactionById(id ?? null);
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [editing, setEditing]       = useState(false);
  const [txType, setTxType]         = useState<TxType>('income');
  const [amount, setAmount]         = useState('');
  const [description, setDesc]      = useState('');
  const [category, setCategory]     = useState('');
  const [method, setMethod]         = useState<'cash' | 'card' | 'transfer'>('cash');
  const [date, setDate]             = useState('');

  function startEdit() {
    if (!tx) return;
    setTxType(tx.type);
    setAmount(String(tx.amount));
    setDesc(tx.description);
    setCategory(tx.category);
    setMethod(tx.payment_method as any);
    setDate(tx.date);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    if (!tx) return;
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Monto inválido');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Error', 'Formato de fecha: YYYY-MM-DD');
      return;
    }
    try {
      await updateTx.mutateAsync({
        id: tx.id,
        type: txType,
        amount: amountNum,
        description: description.trim(),
        category,
        payment_method: method,
        date,
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo actualizar');
    }
  }

  function handleDelete() {
    if (!tx) return;
    Alert.alert(
      'Eliminar movimiento',
      '¿Estás segura de eliminar este movimiento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await deleteTx.mutateAsync(tx.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
            }
          },
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} />
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Movimiento no encontrado</Text>
      </SafeAreaView>
    );
  }

  const isIncome     = tx.type === 'income';
  const amountColor  = isIncome ? '#30D158' : '#FF453A';
  const categories   = (editing ? txType : tx.type) === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const editTxType   = editing ? txType : tx.type;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12,
        }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              backgroundColor: colors.surface,
              borderRadius: 10, padding: 8,
            })}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: colors.text }}>
            Movimiento
          </Text>
          {!editing && (
            <Pressable
              onPress={startEdit}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="pencil-outline" size={22} color={accent} />
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!editing ? (
            /* ── Vista detalle ── */
            <>
              {/* Hero card */}
              <View style={{
                backgroundColor: isIncome ? '#30D15812' : '#FF453A12',
                borderRadius: 24, padding: 24,
                alignItems: 'center', marginBottom: 24,
              }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 16,
                  backgroundColor: isIncome ? '#30D15830' : '#FF453A30',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons
                    name={isIncome ? 'trending-up' : 'trending-down'}
                    size={28}
                    color={amountColor}
                  />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: amountColor, marginBottom: 4 }}>
                  {isIncome ? 'INGRESO' : 'EGRESO'}
                </Text>
                <Text style={{ fontSize: 40, fontWeight: '800', color: colors.text }}>
                  {formatCurrency(tx.amount)}
                </Text>
              </View>

              {/* Info rows */}
              {[
                { label: 'Descripción', value: tx.description },
                { label: 'Categoría',   value: tx.category },
                { label: 'Fecha',       value: tx.date },
                {
                  label: 'Método',
                  value: PAYMENT_METHODS.find(p => p.value === tx.payment_method)?.label ?? tx.payment_method,
                },
              ].map(row => (
                <View key={row.label} style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: colors.borderLight,
                }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{row.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{row.value}</Text>
                </View>
              ))}

              <View style={{ height: 32 }} />

              <Button
                label="Eliminar movimiento"
                variant="destructive"
                onPress={handleDelete}
                loading={deleteTx.isPending}
                fullWidth
              />
            </>
          ) : (
            /* ── Modo edición ── */
            <>
              <SectionLabel label="Tipo" colors={colors} />
              <View style={{
                flexDirection: 'row', gap: 10,
                backgroundColor: colors.surface,
                borderRadius: 16, padding: 4,
              }}>
                {(['income', 'expense'] as TxType[]).map((t) => {
                  const active = editTxType === t;
                  const activeColor = t === 'income' ? '#30D158' : '#FF453A';
                  const activeBg    = t === 'income' ? '#30D15820' : '#FF453A20';
                  return (
                    <Pressable
                      key={t}
                      onPress={() => {
                        setTxType(t);
                        setCategory(t === 'income' ? 'Servicio' : 'Insumos');
                      }}
                      style={({ pressed }) => ({
                        flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
                        backgroundColor: active ? activeBg : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: active ? activeColor : colors.textSecondary }}>
                        {t === 'income' ? 'Ingreso' : 'Egreso'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <SectionLabel label="Monto" colors={colors} />
              <Input label="Monto (MXN) *" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

              <SectionLabel label="Descripción" colors={colors} />
              <Input label="Descripción *" value={description} onChangeText={setDesc} autoCapitalize="sentences" />

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
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: selected ? accent + '20' : colors.surface,
                        borderWidth: 1.5, borderColor: selected ? accent : colors.border,
                      })}
                    >
                      <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '500', color: selected ? accent : colors.textSecondary }}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <SectionLabel label="Método de pago" colors={colors} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {PAYMENT_METHODS.map((pm) => {
                  const selected = method === pm.value;
                  return (
                    <Pressable
                      key={pm.value}
                      onPress={() => setMethod(pm.value)}
                      style={({ pressed }) => ({
                        flex: 1, alignItems: 'center', gap: 6,
                        paddingVertical: 12, borderRadius: 14,
                        backgroundColor: selected ? accent + '20' : colors.surface,
                        borderWidth: 1.5, borderColor: selected ? accent : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Ionicons name={pm.icon as any} size={20} color={selected ? accent : colors.textSecondary} />
                      <Text style={{ fontSize: 11, fontWeight: selected ? '700' : '500', color: selected ? accent : colors.textSecondary, textAlign: 'center' }}>
                        {pm.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <SectionLabel label="Fecha" colors={colors} />
              <Input label="Fecha (YYYY-MM-DD) *" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />

              <View style={{ height: 24 }} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button label="Cancelar" variant="secondary" onPress={cancelEdit} style={{ flex: 1 }} />
                <Button
                  label="Guardar"
                  onPress={handleSave}
                  loading={updateTx.isPending}
                  disabled={updateTx.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
