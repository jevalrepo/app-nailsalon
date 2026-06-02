import { useAuthStore } from '@/stores/useAuthStore';

export function useActiveOrg() {
  const organizations = useAuthStore((s) => s.organizations);
  const orgId = useAuthStore((s) => s.activeOrganizationId);
  const orgRole = useAuthStore((s) => s.activeOrganizationRole);

  const org = organizations.find((o) => o.id === orgId) ?? null;

  return { orgId, orgRole, org };
}
