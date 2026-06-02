import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/database';
import { useSyncQueue } from '@/stores/useSyncQueue';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { SQLiteBindParams } from 'expo-sqlite';
import type { UserRole } from '@/types';

interface CreateEmployeeInput {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

interface UpdateEmployeeInput {
  id: string;
  full_name?: string;
  role?: UserRole;
  phone?: string;
}

// Creación de empleada es solo online — requiere auth.admin
export function useCreateEmployee() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async ({ email, password, full_name, role, phone }: CreateEmployeeInput) => {
      if (!orgId) throw new Error('No hay organización activa');

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('No se pudo crear el usuario');

      // Crear perfil con organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, organization_id: orgId, full_name, role, phone: phone ?? null, avatar_url: null });

      if (profileError) throw profileError;

      // Agregar como miembro de la org
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ organization_id: orgId, user_id: userId, role });

      if (memberError) throw memberError;

      return userId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', orgId] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, full_name, role, phone }: UpdateEmployeeInput) => {
      const db = getDb();
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { updated_at: now };
      if (full_name !== undefined) patch.full_name = full_name;
      if (role !== undefined)      patch.role = role;
      if (phone !== undefined)     patch.phone = phone || null;

      const setClauses = Object.keys(patch).map((k) => `${k}=?`).join(', ');
      await db.runAsync(
        `UPDATE profiles SET ${setClauses}, _synced=0 WHERE id=?`,
        [...Object.values(patch), id] as SQLiteBindParams
      );

      enqueue({ table: 'profiles', operation: 'UPDATE', rowId: id, payload: { id, ...patch }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['employees', orgId] });
      qc.invalidateQueries({ queryKey: ['employees', orgId, vars.id] });
    },
  });
}

export function useChangeEmployeeRole() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { enqueue } = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const db = getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE profiles SET role=?, updated_at=?, _synced=0 WHERE id=?`,
        [role, now, id]
      );

      enqueue({ table: 'profiles', operation: 'UPDATE', rowId: id, payload: { id, role, updated_at: now }, organization_id: orgId ?? null });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['employees', orgId] });
      qc.invalidateQueries({ queryKey: ['employees', orgId, vars.id] });
    },
  });
}
