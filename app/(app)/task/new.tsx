import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCreateTask } from '@/hooks/useTaskMutations';
import { useEmployees } from '@/hooks/useEmployees';
import { Input } from '@/components/ui/Input';
import type { Profile } from '@/types';

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

function EmployeeChip({
  employee, selected, accent, colors, onPress,
}: {
  employee: Profile; selected: boolean; accent: string; colors: any; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 12, marginBottom: 8, marginRight: 8,
        backgroundColor: selected ? accent + '20' : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? accent : colors.border,
        flexDirection: 'row', alignItems: 'center', gap: 6,
      })}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 7,
        backgroundColor: selected ? accent : colors.border,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {selected
          ? <Ionicons name="checkmark" size={13} color="#fff" />
          : <Ionicons name="person" size={11} color={colors.textTertiary} />}
      </View>
      <Text style={{
        fontSize: 13, fontWeight: selected ? '700' : '500',
        color: selected ? accent : colors.textSecondary,
      }}>
        {employee.full_name}
      </Text>
    </Pressable>
  );
}

const DATE_SHORTCUTS = [
  { label: 'Hoy',     days: 0 },
  { label: 'Mañana',  days: 1 },
  { label: 'En 3d',   days: 3 },
  { label: 'En 1 sem',days: 7 },
];

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function NewTaskScreen() {
  const { colors, accent } = useTheme();
  const createTask = useCreateTask();
  const { data: employees = [] } = useEmployees();

  const [title, setTitle]           = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate]       = useState<string | null>(null);

  const isValid = title.trim().length >= 2;

  async function handleSave() {
    if (!isValid) return;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        assigned_to: assignedTo,
        due_date: dueDate,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo crear la tarea');
    }
  }

  const formatDateDisplay = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  };

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
              Nueva tarea
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel label="Descripción" colors={colors} />

          <Input
            label="Título de la tarea *"
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Reabastecer esmaltes gel"
            autoCapitalize="sentences"
            returnKeyType="done"
          />

          {/* Fecha límite */}
          <SectionLabel label="Fecha límite" colors={colors} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pressable
              onPress={() => setDueDate(null)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                backgroundColor: dueDate === null ? accent + '20' : colors.surface,
                borderWidth: 1.5,
                borderColor: dueDate === null ? accent : colors.border,
              })}
            >
              <Text style={{
                fontSize: 13, fontWeight: dueDate === null ? '700' : '500',
                color: dueDate === null ? accent : colors.textSecondary,
              }}>
                Sin fecha
              </Text>
            </Pressable>

            {DATE_SHORTCUTS.map(({ label, days }) => {
              const val = getDateOffset(days);
              const selected = dueDate === val;
              return (
                <Pressable
                  key={label}
                  onPress={() => setDueDate(val)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                    backgroundColor: selected ? accent + '20' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: selected ? accent : colors.border,
                  })}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: selected ? '700' : '500',
                    color: selected ? accent : colors.textSecondary,
                  }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {dueDate && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              marginTop: 10,
            }}>
              <Ionicons name="calendar-outline" size={14} color={accent} />
              <Text style={{ fontSize: 13, color: accent, fontWeight: '600' }}>
                {formatDateDisplay(dueDate)}
              </Text>
            </View>
          )}

          {/* Asignación */}
          {employees.length > 0 && (
            <>
              <SectionLabel label="Asignar a empleada" colors={colors} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => setAssignedTo(null)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 12, marginBottom: 8, marginRight: 8,
                    backgroundColor: assignedTo === null ? accent + '20' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: assignedTo === null ? accent : colors.border,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                  })}
                >
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={assignedTo === null ? accent : colors.textTertiary}
                  />
                  <Text style={{
                    fontSize: 13, fontWeight: assignedTo === null ? '700' : '500',
                    color: assignedTo === null ? accent : colors.textSecondary,
                  }}>
                    Sin asignar
                  </Text>
                </Pressable>
                {employees.map((emp) => (
                  <EmployeeChip
                    key={emp.id}
                    employee={emp}
                    selected={assignedTo === emp.id}
                    accent={accent}
                    colors={colors}
                    onPress={() => setAssignedTo(assignedTo === emp.id ? null : emp.id)}
                  />
                ))}
              </View>
            </>
          )}

          <Pressable
            onPress={handleSave}
            style={{ marginTop: 32, backgroundColor: '#F4A99A', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
          >
            {createTask.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
