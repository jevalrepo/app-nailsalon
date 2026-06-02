import { useState } from 'react';
import {
  View, Text, ScrollView, Alert, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal as RNModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { useCreateClient } from '@/hooks/useClientMutations';

function parseBirthdate(value: string): Date {
  if (!value) return new Date(2000, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(2000, 0, 1);
  return new Date(year, month - 1, day);
}

function formatBirthdateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBirthdateDisplay(value: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(parseBirthdate(value));
}

export default function NewClientScreen() {
  const { colors, accent } = useTheme();
  const createClient = useCreateClient();

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes]       = useState('');
  const [birthdatePickerOpen, setBirthdatePickerOpen] = useState(false);

  const isValid = name.trim().length >= 2;

  async function handleSave() {
    if (!isValid) return;
    try {
      const id = await createClient.mutateAsync({
        name,
        phone: phone || undefined,
        email: email || undefined,
        birthdate: birthdate || undefined,
        notes: notes || undefined,
      });
      router.replace(`/client/${id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la clienta');
    }
  }

  function openBirthdatePicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseBirthdate(birthdate),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setBirthdate(formatBirthdateInput(selectedDate));
          }
        },
      });
      return;
    }
    setBirthdatePickerOpen(true);
  }

  function handleBirthdateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (selectedDate) {
      setBirthdate(formatBirthdateInput(selectedDate));
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
              Nueva clienta
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar placeholder */}
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: accent + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="person" size={36} color={accent} />
            </View>
          </View>

          {/* ── Información básica ── */}
          <SectionLabel label="Información básica" colors={colors} />
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <EditableRow
              icon="person-outline"
              label="Nombre *"
              value={name}
              onChange={setName}
              placeholder="Ej. María García"
              editing
              accent={accent}
              colors={colors}
            />
            <EditableRow
              icon="call-outline"
              label="Teléfono"
              value={phone}
              onChange={setPhone}
              placeholder="Sin teléfono"
              keyboardType="phone-pad"
              editing
              accent={accent}
              colors={colors}
            />
            <EditableRow
              icon="mail-outline"
              label="Correo"
              value={email}
              onChange={setEmail}
              placeholder="Sin correo"
              keyboardType="email-address"
              editing
              accent={accent}
              colors={colors}
            />
            <EditableRow
              icon="gift-outline"
              label="Cumpleaños"
              value={formatBirthdateDisplay(birthdate)}
              onChange={() => {}}
              placeholder="Seleccionar fecha"
              onPress={openBirthdatePicker}
              suffixIcon="calendar-outline"
              editing
              accent={accent}
              colors={colors}
            />
          </View>

          {/* ── Notas ── */}
          <SectionLabel label="Notas" colors={colors} />
          <View style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Alergias, preferencias de diseño, etc."
              placeholderTextColor={colors.textSecondary + '80'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                fontSize: 14,
                color: colors.text,
                lineHeight: 20,
                minHeight: 80,
              }}
            />
          </View>

          <Pressable
            onPress={handleSave}
            style={{ marginTop: 32, backgroundColor: accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
          >
            {createClient.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && (
        <RNModal
          visible={birthdatePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setBirthdatePickerOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
            onPress={() => setBirthdatePickerOpen(false)}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 34,
              }}>
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                </View>
                <View style={{ paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="calendar-outline" size={17} color={accent} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      Cumpleaños
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setBirthdatePickerOpen(false)}
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
                <DateTimePicker
                  value={parseBirthdate(birthdate)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleBirthdateChange}
                  accentColor={accent}
                  textColor={colors.text}
                  themeVariant={colors.background === '#000000' ? 'dark' : 'light'}
                />
              </View>
            </Pressable>
          </Pressable>
        </RNModal>
      )}
    </SafeAreaView>
  );
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

function EditableRow({
  icon, label, value, onChange, placeholder, keyboardType, editing, accent, colors, onPress, suffixIcon,
}: {
  icon: string; label: string; value: string; onChange: (v: string) => void;
  placeholder: string; keyboardType?: any; editing: boolean;
  accent: string; colors: any;
  onPress?: () => void;
  suffixIcon?: string;
}) {
  const content = (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: accent + '16',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={16} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
        {editing ? (
          onPress ? (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: value ? colors.text : colors.textSecondary + '80',
              }}>
                {value || placeholder}
              </Text>
              {suffixIcon && (
                <Ionicons name={suffixIcon as any} size={16} color={colors.textSecondary} />
              )}
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 2,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.text,
                  paddingVertical: 8,
                }}
              />
            </View>
          )
        ) : (
          <Text style={{ fontSize: 14, color: value ? colors.text : colors.textSecondary + '80' }}>
            {value || placeholder}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}
