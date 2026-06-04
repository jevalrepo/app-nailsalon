import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import type { Organization } from '@/types';

export function useActiveOrg() {
  const organizations = useAuthStore((s) => s.organizations);
  const orgId = useAuthStore((s) => s.activeOrganizationId);
  const orgRole = useAuthStore((s) => s.activeOrganizationRole);

  // Fetch fresco de la org activa para tener logo_url actualizado
  const { data: freshOrg } = useQuery<Organization | null>({
    queryKey: ['org', orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug, plan, is_active, created_at, logo_url')
        .eq('id', orgId!)
        .single();
      return data ?? null;
    },
  });

  const storeOrg = organizations.find((o) => o.id === orgId) ?? null;
  const org = freshOrg && storeOrg
    ? { ...freshOrg, logo_url: freshOrg.logo_url ?? storeOrg.logo_url }
    : freshOrg ?? storeOrg;

  return { orgId, orgRole, org };
}
