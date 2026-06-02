import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import type { Invitation } from '@/types';

export function useInvitations() {
  const { orgId } = useActiveOrg();

  return useQuery<Invitation[]>({
    queryKey: ['invitations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function isPending(inv: Invitation): boolean {
  return inv.accepted_at === null && new Date(inv.expires_at) > new Date();
}

export function isExpired(inv: Invitation): boolean {
  return inv.accepted_at === null && new Date(inv.expires_at) <= new Date();
}

export function isAccepted(inv: Invitation): boolean {
  return inv.accepted_at !== null;
}
