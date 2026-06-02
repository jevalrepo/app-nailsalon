import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTaskById, isOverdue } from '@/hooks/useTasks';
import { useUpdateTask, useToggleTask, useDeleteTask } from '@/hooks/useTaskMutations';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useTheme();
  const { session } = useAuthStore();
  const { orgRole } = useActiveOrg();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const { data: task, isLoading } = useTaskById(id);
  const { data: employees = [] } = useEmployees();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle]           = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate]       = useState<string | null>(null);
  const [editing, setEditing]       = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssignedTo(task.assigned_to);
      setDueDate(task.due_date);
    }
  }, [task]);

  const canEdit = isAdmin || task?.created_by === session?.user.id || task?.assigned_to === session?.user.id;
  const canDelete = isAdmin || task?.created_by === session?.user.id;
  const isDirty = task && (
    title.trim() !== task.title ||
    assignedTo !== task.assigned_to ||
    dueDate !== task.due_date
  );

  async function handleSave() {
    if (!task || !title.trim()) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: title.trim(),
        assigned_to: assignedTo,
        due_date: dueDate,
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la tarea');
    }
  }

  function handleDelete() {
    if (!task) return;
    Alert.alert(
      'Eliminar tarea',
      `¿Eliminar "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            await deleteTask.mutateAsync(task.id);
            router.back();
          },
        },
      ],
    );
  }

  function handleToggle() {
    if (!task) return;
    toggleTask.mutate({ id: task.id, completed: !task.is_completed });
  }

  const formatDateDisplay = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Tarea no encontrada</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const overdue = isOverdue(task);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            Detalle de tarea
          </Text>
          {canDelete && (
            <Pressable
              onPress={handleDelete}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: '#FF453A12',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="trash-outline" size={17} color="#FF453A" />
              </View>
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card de estado */}
          <View style={{
            backgroundColor: task.is_completed
              ? '#30D15812'
              : overdue
              ? '#FF9F0A12'
              : accent + '12',
            borderRadius: 20, padding: 20, marginTop: 4,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}>
            <Pressable onPress={handleToggle} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{
                width: 36, height: 36, borderRadius: 11,
                borderWidth: task.is_completed ? 0 : 2,
                borderColor: task.is_completed ? 'transparent' : (overdue ? '#FF9F0A' : accent),
                backgroundColor: task.is_completed ? '#30D158' : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {task.is_completed && <Ionicons name="checkmark" size={20} color="#fff" />}
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 17, fontWeight: '700',
                color: task.is_completed ? '#30D158' : overdue ? '#FF9F0A' : accent,
              }}>
                {task.is_completed ? 'Completada' : overdue ? 'Vencida' : 'Pendiente'}
              </Text>
              {task.due_date && (
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {task.is_completed ? 'Fue vencimiento:' : 'Vence:'} {formatDateDisplay(task.due_date)}
                </Text>
              )}
            </View>
            {canEdit && (
              <Pressable
                onPress={() => setEditing(!editing)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                  backgroundColor: editing ? accent : colors.surface,
                  borderWidth: 1, borderColor: editing ? accent : colors.border,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: editing ? '#fff' : colors.textSecondary }}>
                    {editing ? 'Editando' : 'Editar'}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Título */}
          <SectionLabel label="Descripción" colors={colors} />
          {editing ? (
            <Input
              label="Título de la tarea *"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          ) : (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 14, padding: 14,
            }}>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
                {task.title}
              </Text>
            </View>
          )}

          {/* Fecha límite */}
          {editing ? (
            <>
              <SectionLabel label="Fecha límite" colors={colors} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable
                  onPress={() => setDueDate(null)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                    backgroundColor: dueDate === null ? accent + '20' : colors.surface,
                    borderWidth: 1.5, borderColor: dueDate === null ? accent : colors.border,
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
                        borderWidth: 1.5, borderColor: selected ? accent : colors.border,
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
            </>
          ) : task.due_date ? (
            <>
              <SectionLabel label="Fecha límite" colors={colors} />
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: colors.surface, borderRadius: 14, padding: 14,
              }}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={overdue ? '#FF9F0A' : accent}
                />
                <Text style={{ fontSize: 14, color: overdue ? '#FF9F0A' : colors.text, fontWeight: '500' }}>
                  {formatDateDisplay(task.due_date)}
                </Text>
              </View>
            </>
          ) : null}

          {/* Asignación */}
          {editing ? (
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
                    borderWidth: 1.5, borderColor: assignedTo === null ? accent : colors.border,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                  })}
                >
                  <Ionicons name="people-outline" size={14} color={assignedTo === null ? accent : colors.textTertiary} />
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
          ) : task.assigned_to_name ? (
            <>
              <SectionLabel label="Asignada a" colors={colors} />
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: colors.surface, borderRadius: 14, padding: 14,
              }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: accent + '18',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="person" size={16} color={accent} />
                </View>
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }}>
                  {task.assigned_to_name}
                </Text>
              </View>
            </>
          ) : null}

          {/* Meta info */}
          <SectionLabel label="Información" colors={colors} />
          <View style={{
            backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 10,
          }}>
            {task.created_by_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="create-outline" size={14} color={colors.textTertiary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Creada por <Text style={{ fontWeight: '600', color: colors.text }}>{task.created_by_name}</Text>
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {new Date(task.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Acción principal — completar/reabrir */}
          <View style={{ marginTop: 24 }}>
            <Button
              label={task.is_completed ? 'Reabrir tarea' : 'Marcar como completada'}
              variant={task.is_completed ? 'secondary' : 'primary'}
              onPress={handleToggle}
              loading={toggleTask.isPending}
              fullWidth
            />
          </View>

          {/* Guardar cambios (modo edición) */}
          {editing && isDirty && (
            <View style={{ marginTop: 12 }}>
              <Button
                label="Guardar cambios"
                onPress={handleSave}
                disabled={!title.trim() || updateTask.isPending}
                loading={updateTask.isPending}
                fullWidth
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
