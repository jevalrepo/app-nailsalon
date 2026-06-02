import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTasks, isOverdue, type TaskWithProfile } from '@/hooks/useTasks';
import { useToggleTask, useDeleteTask } from '@/hooks/useTaskMutations';
import { useAuthStore } from '@/stores/useAuthStore';
import { useActiveOrg } from '@/hooks/useActiveOrg';

type FilterKey = 'all' | 'pending' | 'completed' | 'mine';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Todas'       },
  { key: 'pending',   label: 'Pendientes'  },
  { key: 'mine',      label: 'Mis tareas'  },
  { key: 'completed', label: 'Completadas' },
];

function FilterChip({
  label, active, accent, colors, onPress,
}: {
  label: string; active: boolean; accent: string; colors: any; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: active ? accent : colors.surface,
        borderWidth: active ? 0 : 1, borderColor: colors.border,
        marginRight: 8,
      }}>
        <Text style={{
          fontSize: 13, fontWeight: active ? '600' : '500',
          color: active ? '#fff' : colors.textSecondary,
        }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function TaskRow({
  task, colors, accent, onToggle, onDelete, onEdit, canDelete,
}: {
  task: TaskWithProfile;
  colors: any;
  accent: string;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  canDelete: boolean;
}) {
  const overdue = isOverdue(task);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  return (
    <Pressable onPress={onEdit} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surfaceElevated,
        borderRadius: 18, padding: 14, marginBottom: 8,
        borderWidth: overdue ? 1 : 0,
        borderColor: overdue ? '#FF9F0A' : colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        gap: 12,
      }}>
        {/* Checkbox */}
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <View style={{
            width: 24, height: 24, borderRadius: 8,
            borderWidth: task.is_completed ? 0 : 2,
            borderColor: task.is_completed ? 'transparent' : colors.border,
            backgroundColor: task.is_completed ? accent : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {task.is_completed && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
        </Pressable>

        {/* Contenido */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15, fontWeight: '600', color: colors.text,
            textDecorationLine: task.is_completed ? 'line-through' : 'none',
            opacity: task.is_completed ? 0.5 : 1,
          }} numberOfLines={2}>
            {task.title}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
            {task.assigned_to_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="person-outline" size={11} color={accent} />
                <Text style={{ fontSize: 11, color: accent, fontWeight: '600' }}>
                  {task.assigned_to_name}
                </Text>
              </View>
            )}
            {task.due_date && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons
                  name={overdue ? 'alert-circle-outline' : 'calendar-outline'}
                  size={11}
                  color={overdue ? '#FF9F0A' : colors.textTertiary}
                />
                <Text style={{
                  fontSize: 11,
                  color: overdue ? '#FF9F0A' : colors.textTertiary,
                  fontWeight: overdue ? '600' : '400',
                }}>
                  {formatDate(task.due_date)}{overdue ? ' · Vencida' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {canDelete && (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: '#FF453A12',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="trash-outline" size={15} color="#FF453A" />
              </View>
            </Pressable>
          )}
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function TasksScreen() {
  const { colors, accent } = useTheme();
  const { session } = useAuthStore();
  const { orgRole } = useActiveOrg();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const { data: tasks = [], isLoading, isFetching, isError, error, refetch } = useTasks(activeFilter);
  const toggleTask  = useToggleTask();
  const deleteTask  = useDeleteTask();

  const pendingCount = tasks.filter((t) => !t.is_completed).length;

  function handleDelete(task: TaskWithProfile) {
    Alert.alert(
      'Eliminar tarea',
      `¿Eliminar "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => deleteTask.mutate(task.id),
        },
      ],
    );
  }

  function canDelete(task: TaskWithProfile): boolean {
    if (isAdmin) return true;
    return task.created_by === session?.user.id;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Tareas</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isFetching && !isLoading && <ActivityIndicator size="small" color={accent} />}
            {pendingCount > 0 && (
              <View style={{ backgroundColor: accent + '22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: accent }}>{pendingCount}</Text>
              </View>
            )}
            <Pressable onPress={() => router.push('/task/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Filtros */}
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingRight: 4 }}
          renderItem={({ item: f }) => (
            <FilterChip
              label={f.label}
              active={activeFilter === f.key}
              accent={accent}
              colors={colors}
              onPress={() => setActiveFilter(f.key)}
            />
          )}
        />
      </View>

      {/* ── Contenido ── */}
      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 20 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' }}>Error al cargar tareas</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 16, textAlign: 'center' }}>
            {(error as Error)?.message ?? 'Intenta de nuevo'}
          </Text>
          <Pressable onPress={() => refetch()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ backgroundColor: accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Reintentar</Text>
            </View>
          </Pressable>
        </View>
      ) : tasks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: accent + '18',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Ionicons name="checkmark-done-outline" size={32} color={accent} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {activeFilter === 'completed' ? 'Sin tareas completadas' :
             activeFilter === 'mine'      ? 'No tienes tareas asignadas' :
             'Sin tareas pendientes'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
            {activeFilter === 'all' || activeFilter === 'pending'
              ? 'Crea la primera tarea para el equipo'
              : activeFilter === 'mine'
              ? 'Las tareas asignadas a ti aparecen aquí'
              : 'Completa tareas para verlas aquí'}
          </Text>
          {(activeFilter === 'all' || activeFilter === 'pending') && (
            <Pressable onPress={() => router.push('/task/new')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ backgroundColor: accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nueva tarea</Text>
              </View>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              colors={colors}
              accent={accent}
              onToggle={() => toggleTask.mutate({ id: item.id, completed: !item.is_completed })}
              onDelete={() => handleDelete(item)}
              onEdit={() => router.push(`/task/${item.id}`)}
              canDelete={canDelete(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          onRefresh={refetch} refreshing={false}
          bounces={false} overScrollMode="never"
        />
      )}
    </SafeAreaView>
  );
}
