import {
  View, Text, Pressable, ScrollView, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/hooks/useBranches';
import { useCreateBranch, useUpdateBranch, useToggleBranch } from '@/hooks/useBranchMutations';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Branch } from '@/types';

function Field({
  label, value, onChangeText, placeholder, colors, accent,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; colors: any; accent: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderWidth: 1.5, borderColor: focused ? accent : colors.border,
          borderRadius: 12, backgroundColor: colors.surface,
          paddingHorizontal: 14, paddingVertical: 12,
          fontSize: 15, color: colors.text,
        }}
      />
    </View>
  );
}

function BranchForm({
  initial, onSave, onCancel, isPending, colors, accent,
}: {
  initial?: Partial<Branch>;
  onSave: (data: { name: string; address: string; phone: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  colors: any; accent: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');

  return (
    <View style={{
      backgroundColor: colors.surfaceElevated, borderRadius: 20, padding: 20, marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    }}>
      <Field label="Nombre de la sucursal *" value={name} onChangeText={setName} placeholder="Sucursal Centro" colors={colors} accent={accent} />
      <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Calle y número" colors={colors} accent={accent} />
      <Field label="Teléfono" value={phone} onChangeText={setPhone} placeholder="55 1234 5678" colors={colors} accent={accent} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => ({
            flex: 1, height: 44, borderRadius: 12,
            borderWidth: 1.5, borderColor: colors.border,
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!name.trim()) { Alert.alert('Falta el nombre'); return; }
            onSave({ name: name.trim(), address: address.trim(), phone: phone.trim() });
          }}
          disabled={isPending}
          style={({ pressed }) => ({
            flex: 1, height: 44, borderRadius: 12,
            backgroundColor: accent, alignItems: 'center', justifyContent: 'center',
            opacity: pressed || isPending ? 0.7 : 1,
          })}
        >
          {isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Guardar</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

function BranchRow({
  branch, activeBranchId, onEdit, onToggle, onSelect, colors, accent,
}: {
  branch: Branch; activeBranchId: string | null;
  onEdit: () => void; onToggle: () => void; onSelect: () => void;
  colors: any; accent: string;
}) {
  const isActive = activeBranchId === branch.id;

  return (
    <View style={{
      backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16, marginBottom: 10,
      borderWidth: isActive ? 2 : 0, borderColor: accent,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: branch.is_active ? accent + '20' : colors.surface,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="storefront-outline" size={20} color={branch.is_active ? accent : colors.textTertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: branch.is_active ? colors.text : colors.textTertiary }}>
              {branch.name}
            </Text>
            {branch.is_default && (
              <View style={{ backgroundColor: accent + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: accent }}>PRINCIPAL</Text>
              </View>
            )}
            {isActive && (
              <View style={{ backgroundColor: '#30D15820', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#30D158' }}>ACTIVA</Text>
              </View>
            )}
          </View>
          {branch.address ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {branch.address}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {!isActive && branch.is_active && (
          <Pressable
            onPress={onSelect}
            style={({ pressed }) => ({
              flex: 1, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: accent,
              alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: accent }}>Ir a esta</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => ({
            flex: 1, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border,
            alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>Editar</Text>
        </Pressable>
        {!branch.is_default && (
          <Pressable
            onPress={onToggle}
            style={({ pressed }) => ({
              height: 34, paddingHorizontal: 14, borderRadius: 10,
              borderWidth: 1.5, borderColor: branch.is_active ? '#FF453A' : colors.border,
              alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: branch.is_active ? '#FF453A' : colors.textSecondary }}>
              {branch.is_active ? 'Desactivar' : 'Activar'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AdminBranchesScreen() {
  const { colors, accent } = useTheme();
  const { orgRole } = useActiveOrg();
  const { branchId, branches } = useActiveBranch();
  const setActiveBranch = useAuthStore((s) => s.setActiveBranch);
  const { isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const toggleBranch = useToggleBranch();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (orgRole !== 'admin' && orgRole !== 'owner') return <Redirect href="/(app)/(tabs)" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: colors.text }}>Sucursales</Text>
        {!showCreate && (
          <Pressable
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => ({
              backgroundColor: accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Nueva</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        {showCreate && (
          <BranchForm
            onCancel={() => setShowCreate(false)}
            onSave={async (data) => {
              await createBranch.mutateAsync(data);
              setShowCreate(false);
            }}
            isPending={createBranch.isPending}
            colors={colors}
            accent={accent}
          />
        )}

        {isLoading ? (
          <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
        ) : (
          branches.map((branch) => (
            editingId === branch.id ? (
              <BranchForm
                key={branch.id}
                initial={branch}
                onCancel={() => setEditingId(null)}
                onSave={async (data) => {
                  await updateBranch.mutateAsync({ id: branch.id, ...data });
                  setEditingId(null);
                }}
                isPending={updateBranch.isPending}
                colors={colors}
                accent={accent}
              />
            ) : (
              <BranchRow
                key={branch.id}
                branch={branch}
                activeBranchId={branchId}
                onEdit={() => setEditingId(branch.id)}
                onToggle={() => {
                  Alert.alert(
                    branch.is_active ? 'Desactivar sucursal' : 'Activar sucursal',
                    `¿${branch.is_active ? 'Desactivar' : 'Activar'} "${branch.name}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: branch.is_active ? 'Desactivar' : 'Activar',
                        style: branch.is_active ? 'destructive' : 'default',
                        onPress: () => toggleBranch.mutate({ id: branch.id, is_active: !branch.is_active }),
                      },
                    ]
                  );
                }}
                onSelect={() => {
                  setActiveBranch(branch.id);
                  router.back();
                }}
                colors={colors}
                accent={accent}
              />
            )
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
