import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useInventoryItem, isLowStock } from '@/hooks/useInventory';
import { useUpdateInventoryItem, useDeleteInventoryItem } from '@/hooks/useInventoryMutations';
import { useAuthStore } from '@/stores/useAuthStore';

const UNITS = [
  { value: 'piezas', icon: 'cube-outline', label: 'Piezas' },
  { value: 'ml', icon: 'water-outline', label: 'Mililitros' },
  { value: 'gr', icon: 'flask-outline', label: 'Gramos' },
  { value: 'litros', icon: 'beaker-outline', label: 'Litros' },
  { value: 'kg', icon: 'barbell-outline', label: 'Kilogramos' },
  { value: 'cajas', icon: 'file-tray-full-outline', label: 'Cajas' },
  { value: 'pares', icon: 'footsteps-outline', label: 'Pares' },
  { value: 'rollos', icon: 'albums-outline', label: 'Rollos' },
] as const;

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

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const { data: item, isLoading } = useInventoryItem(id);
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const [name, setName]           = useState('');
  const [quantity, setQuantity]   = useState('');
  const [unit, setUnit]           = useState('piezas');
  const [minStock, setMinStock]   = useState('');
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setMinStock(String(item.min_stock));
  }, [item]);

  const hasChanges = item && (
    name.trim() !== item.name ||
    quantity !== String(item.quantity) ||
    unit !== item.unit ||
    minStock !== String(item.min_stock)
  );

  async function handleSave() {
    if (!item) return;
    const qty = parseFloat(quantity.replace(',', '.'));
    const min = parseFloat((minStock || '0').replace(',', '.'));

    if (isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    try {
      await updateItem.mutateAsync({
        id: item.id,
        name: name.trim(),
        quantity: qty,
        unit,
        min_stock: isNaN(min) ? 0 : min,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo actualizar');
    }
  }

  function handleDelete() {
    if (!item) return;
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que quieres eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem.mutateAsync(item.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }

  if (isLoading || !item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const low = isLowStock(item);
  const heroColor = low ? '#FF453A' : accent;
  const quantityValue = parseFloat(quantity.replace(',', '.'));
  const minStockValue = parseFloat((minStock || '0').replace(',', '.'));
  const selectedUnitMeta = UNITS.find((u) => u.value === unit) ?? UNITS[0];

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
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {name || item.name}
            </Text>
          </Pressable>

        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            backgroundColor: heroColor + '12',
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: heroColor + '30',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: heroColor + '20',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons
                  name={low ? 'warning-outline' : 'cube-outline'}
                  size={22}
                  color={heroColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                {isAdmin ? (
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nombre del producto"
                    placeholderTextColor={colors.placeholder}
                    style={{
                      fontSize: 22,
                      fontWeight: '800',
                      color: colors.text,
                      paddingVertical: 0,
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                    {item.name}
                  </Text>
                )}
                {low && (
                  <Text style={{ fontSize: 12, color: '#FF453A', fontWeight: '600', marginTop: 2 }}>
                    Bajo stock — reponer pronto
                  </Text>
                )}
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              gap: 12,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: heroColor + '25',
            }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                {isAdmin ? (
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={heroColor + '80'}
                    style={{
                      fontSize: 28,
                      fontWeight: '800',
                      color: heroColor,
                      paddingVertical: 0,
                      minWidth: 80,
                      textAlign: 'center',
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 28, fontWeight: '800', color: heroColor }}>
                    {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity.toFixed(1)}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  {unit} en stock
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: heroColor + '25' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                {isAdmin ? (
                  <TextInput
                    value={minStock}
                    onChangeText={setMinStock}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                    style={{
                      fontSize: 28,
                      fontWeight: '800',
                      color: colors.textSecondary,
                      paddingVertical: 0,
                      minWidth: 80,
                      textAlign: 'center',
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textSecondary }}>
                    {item.min_stock % 1 === 0 ? item.min_stock.toFixed(0) : item.min_stock.toFixed(1)}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  mínimo ({unit})
                </Text>
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.textSecondary,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Unidad de medida
            </Text>
            <Pressable
              onPress={() => isAdmin && setUnitPickerOpen(true)}
              disabled={!isAdmin}
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
                alignSelf: 'flex-start',
              })}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: accent + '25',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}>
                <Ionicons name={selectedUnitMeta.icon as any} size={12} color={accent} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: accent }}>
                  {selectedUnitMeta.label}
                </Text>
                {isAdmin && <Ionicons name="chevron-down" size={11} color={accent} />}
              </View>
            </Pressable>
          </View>

          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 16,
            padding: 14,
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Registrado el{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {new Date(item.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </Text>
            {isAdmin && (Number.isNaN(quantityValue) || quantityValue < 0 || Number.isNaN(minStockValue)) && (
              <Text style={{ fontSize: 12, color: '#FF453A', marginTop: 8 }}>
                Revisa cantidad y stock mínimo antes de guardar.
              </Text>
            )}
          </View>

          {isAdmin && (
            <Pressable
              onPress={handleDelete}
              disabled={deleteItem.isPending}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#FF453A12',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#FF453A30',
              }}>
                <Ionicons name="trash-outline" size={18} color="#FF453A" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FF453A' }}>
                  Eliminar producto
                </Text>
              </View>
            </Pressable>
          )}
        </ScrollView>

        {isAdmin && hasChanges && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
            backgroundColor: colors.background,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <Pressable
              onPress={handleSave}
              disabled={name.trim().length < 2 || updateItem.isPending}
              style={{
                backgroundColor: accent,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                opacity: name.trim().length < 2 || updateItem.isPending ? 0.5 : 1,
              }}
            >
              {updateItem.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>}
            </Pressable>
          </View>
        )}

        <Modal
          visible={unitPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setUnitPickerOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
            onPress={() => setUnitPickerOpen(false)}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 34,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.12,
                shadowRadius: 20,
              }}>
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                </View>

                <View style={{ paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="albums-outline" size={17} color={accent} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      Unidad de medida
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setUnitPickerOpen(false)}
                    hitSlop={12}
                    style={({ pressed }) => ({
                      position: 'absolute',
                      right: 20, top: 14,
                      backgroundColor: accent,
                      borderRadius: 10,
                      paddingHorizontal: 18,
                      paddingVertical: 8,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Listo</Text>
                  </Pressable>
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20 }} />

                <ScrollView
                  style={{ maxHeight: 320 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
                >
                  {UNITS.map((option) => {
                    const selected = unit === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setUnit(option.value);
                          setUnitPickerOpen(false);
                        }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.72 : 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          width: '100%',
                          marginBottom: 8,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: selected ? accent : colors.border,
                          backgroundColor: selected ? accent + '18' : colors.surface,
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                        })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                          <View style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected ? accent + '24' : colors.background,
                            marginRight: 12,
                          }}>
                            <Ionicons name={option.icon as any} size={18} color={selected ? accent : colors.textSecondary} />
                          </View>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: selected ? '700' : '500',
                            color: selected ? accent : colors.text,
                          }}>
                            {option.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
