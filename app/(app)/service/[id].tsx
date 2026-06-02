import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, Switch,
  ActivityIndicator, TextInput, Modal, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useServiceById } from '@/hooks/useServices';
import { useUpdateService, useToggleServiceActive } from '@/hooks/useServiceMutations';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { ServiceCategory } from '@/types';

const CATEGORIES: { value: ServiceCategory; label: string; icon: string }[] = [
  { value: 'manicure', label: 'Manicure', icon: 'hand-left-outline' },
  { value: 'pedicure', label: 'Pedicure', icon: 'footsteps-outline' },
  { value: 'gel',      label: 'Gel',      icon: 'sparkles-outline' },
  { value: 'acrilico', label: 'Acrílico', icon: 'diamond-outline' },
  { value: 'otro',     label: 'Otro',     icon: 'color-palette-outline' },
];

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  manicure: '#F4A99A',
  pedicure: '#C4B5FD',
  gel:      '#6EE7B7',
  acrilico: '#7DD3FC',
  otro:     '#FDBA74',
};

const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180];

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { orgRole } = useActiveOrg();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const { data: service, isLoading } = useServiceById(id);
  const updateService  = useUpdateService();
  const toggleActive   = useToggleServiceActive();

  const [name,             setName]             = useState('');
  const [description,      setDescription]      = useState('');
  const [price,            setPrice]            = useState('');
  const [category,         setCategory]         = useState<ServiceCategory>('manicure');
  const [durationMin,      setDurationMin]      = useState(60);
  const [appliesSurcharge, setAppliesSurcharge] = useState(false);
  const [durationPickerOpen, setDurationPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Poblar estado cuando carga el servicio
  useEffect(() => {
    if (!service) return;
    setName(service.name);
    setDescription(service.description ?? '');
    setPrice(String(service.price));
    setCategory(service.category);
    setDurationMin(service.duration_min);
    setAppliesSurcharge(service.applies_surcharge);
  }, [service]);

  const hasChanges = service && (
    name.trim()      !== service.name             ||
    description.trim() !== (service.description ?? '') ||
    price            !== String(service.price)    ||
    category         !== service.category         ||
    durationMin      !== service.duration_min     ||
    appliesSurcharge !== service.applies_surcharge
  );

  async function handleSave() {
    if (!service) return;
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }
    try {
      await updateService.mutateAsync({
        id: service.id,
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        duration_min: durationMin,
        category,
        applies_surcharge: appliesSurcharge,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo actualizar');
    }
  }

  async function handleToggleActive() {
    if (!service) return;
    const nextState = !service.is_active;
    Alert.alert(
      `¿${nextState ? 'Activar' : 'Desactivar'} servicio?`,
      `El servicio "${service.name}" quedará ${nextState ? 'disponible para citas' : 'oculto al registrar citas'}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nextState ? 'Activar' : 'Desactivar',
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await toggleActive.mutateAsync({ id: service.id, is_active: nextState });
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo cambiar el estado');
            }
          },
        },
      ]
    );
  }

  if (isLoading || !service) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const catColor = CATEGORY_COLORS[category];

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
              {name || service.name}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero card ── */}
          <View style={{
            backgroundColor: catColor + '15',
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: catColor + '30',
          }}>
            {/* Nombre editable */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              {/* Badge categoría — tappable si es admin */}
              <Pressable
                onPress={() => isAdmin && setCategoryPickerOpen(true)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'flex-start' })}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: catColor + '25',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}>
                  <Ionicons name={CATEGORIES.find(c => c.value === category)?.icon as any} size={12} color={catColor} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: catColor }}>
                    {CATEGORIES.find(c => c.value === category)?.label}
                  </Text>
                  {isAdmin && <Ionicons name="chevron-down" size={11} color={catColor} />}
                </View>
              </Pressable>
              {isAdmin && (
                <View style={{ marginLeft: 12, alignSelf: 'center' }}>
                  <Switch
                    value={service.is_active}
                    onValueChange={handleToggleActive}
                    trackColor={{ false: 'transparent', true: accent + '80' }}
                    ios_backgroundColor="transparent"
                    thumbColor={accent}
                    disabled={toggleActive.isPending}
                  />
                </View>
              )}
            </View>

            {isAdmin ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre del servicio"
                placeholderTextColor={colors.placeholder}
                style={{
                  fontSize: 22, fontWeight: '800', color: colors.text,
                  paddingVertical: 0, marginBottom: 2,
                }}
              />
            ) : (
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                {service.name}
              </Text>
            )}

            {isAdmin ? (
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción opcional"
                placeholderTextColor={colors.placeholder}
                multiline
                style={{
                  fontSize: 14, color: colors.textSecondary,
                  marginTop: 4, lineHeight: 20, paddingVertical: 0,
                }}
              />
            ) : service.description ? (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                {service.description}
              </Text>
            ) : null}

            {/* Precio y duración */}
            <View style={{
              flexDirection: 'row',
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: catColor + '25',
            }}>
              {/* Precio editable */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                {isAdmin ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: catColor }}>$</Text>
                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      placeholderTextColor={catColor + '80'}
                      style={{
                        fontSize: 26, fontWeight: '800', color: catColor,
                        paddingVertical: 0, minWidth: 60, textAlign: 'center',
                      }}
                    />
                  </View>
                ) : (
                  <Text style={{ fontSize: 26, fontWeight: '800', color: catColor }}>
                    ${service.price % 1 === 0 ? service.price.toFixed(0) : service.price.toFixed(2)}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Precio</Text>
              </View>

              <View style={{ width: 1, backgroundColor: catColor + '25' }} />

              {/* Duración */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                {isAdmin ? (
                  <Pressable
                    onPress={() => setDurationPickerOpen(true)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: 'center' })}
                  >
                    <Text style={{ fontSize: 26, fontWeight: '800', color: catColor }}>
                      {formatDuration(durationMin)}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 26, fontWeight: '800', color: catColor }}>
                    {formatDuration(service.duration_min)}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Duración</Text>
              </View>
            </View>
          </View>

          {/* ── Precio / Recargo (solo admin) ── */}
          {isAdmin && (
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: accent + '18',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="flash-outline" size={16} color={accent} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: 0.2, flex: 1 }}>
                  Recargo fuera de horario laboral
                </Text>
                <Switch
                  value={appliesSurcharge}
                  onValueChange={setAppliesSurcharge}
                  trackColor={{ false: 'transparent', true: accent + '80' }}
                  ios_backgroundColor="transparent"
                  thumbColor={accent}
                />
              </View>
            </View>
          )}

        </ScrollView>

        {/* ── Modal picker de categoría ── */}
        <Modal
          visible={categoryPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryPickerOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
            onPress={() => setCategoryPickerOpen(false)}
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
                <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: accent + '16',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}>
                      <Ionicons name="grid-outline" size={20} color={accent} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
                      Categoría del servicio
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                      Elige la categoría que mejor describe este servicio.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setCategoryPickerOpen(false)}
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
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {CATEGORIES.map((cat, index) => {
                    const selected = category === cat.value;
                    const catCol = CATEGORY_COLORS[cat.value];
                    const isLastOdd = index === CATEGORIES.length - 1 && CATEGORIES.length % 2 === 1;

                    return (
                      <Pressable
                        key={cat.value}
                        onPress={() => { setCategory(cat.value); setCategoryPickerOpen(false); }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.72 : 1,
                          width: isLastOdd ? '100%' : '48%',
                          minHeight: isLastOdd ? 84 : 116,
                          marginBottom: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 20,
                          backgroundColor: selected ? catCol + '18' : colors.surface,
                          borderWidth: 1.5,
                          borderColor: selected ? catCol : colors.border,
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                        })}
                      >
                        <View style={{
                          width: 46,
                          height: 46,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? catCol + '24' : colors.background,
                          marginBottom: 10,
                        }}>
                          <Ionicons name={cat.icon as any} size={24} color={selected ? catCol : colors.textSecondary} />
                        </View>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: selected ? '800' : '600',
                          color: selected ? catCol : colors.text,
                          textAlign: 'center',
                        }}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── Modal picker de duración ── */}
        <Modal
          visible={durationPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDurationPickerOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
            onPress={() => setDurationPickerOpen(false)}
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
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                </View>

                {/* Título + botón Listo */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="time-outline" size={17} color={accent} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      Duración del servicio
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setDurationPickerOpen(false)}
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

                {/* Lista de opciones */}
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8, width: '100%', alignItems: 'center' }}
                >
                  {DURATIONS.map((d) => {
                    const selected = durationMin === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => { setDurationMin(d); setDurationPickerOpen(false); }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                          width: '100%',
                          alignItems: 'center',
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        })}
                      >
                        <Text style={{
                          fontSize: 16,
                          fontWeight: selected ? '700' : '400',
                          color: selected ? accent : colors.text,
                        }}>
                          {formatDuration(d)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Botón guardar flotante — solo cuando hay cambios */}
        {isAdmin && hasChanges && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
            backgroundColor: colors.background,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <Pressable
              onPress={handleSave}
              disabled={name.trim().length < 2 || updateService.isPending}
              style={{
                backgroundColor: '#F4A99A',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                opacity: name.trim().length < 2 || updateService.isPending ? 0.5 : 1,
              }}
            >
              {updateService.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
              }
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
