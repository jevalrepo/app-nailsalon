import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useAuthStore } from '@/stores/useAuthStore';
import type { InvitationRole } from '@/types';

export interface CreateInvitationPayload {
  email: string;
  role: InvitationRole;
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: CreateInvitationPayload) => {
      if (!orgId) throw new Error('Sin organización activa');

      // Check if there's already a pending invitation for this email
      const { data: existing } = await supabase
        .from('invitations')
        .select('id, accepted_at, expires_at')
        .eq('organization_id', orgId)
        .eq('email', payload.email.toLowerCase().trim())
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existing) {
        throw new Error('Ya hay una invitación pendiente para este correo.');
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: orgId,
          email: payload.email.toLowerCase().trim(),
          role: payload.role,
          invited_by: profile?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
  });
}

export function useResendInvitation() {
  const qc = useQueryClient();
  const { orgId } = useActiveOrg();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      // Extend expiry by 7 more days from now
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const { data, error } = await supabase
        .from('invitations')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
  });
}
