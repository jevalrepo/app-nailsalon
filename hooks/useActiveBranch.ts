import { useAuthStore } from '@/stores/useAuthStore';

export function useActiveBranch() {
  const branches    = useAuthStore((s) => s.branches);
  const branchId    = useAuthStore((s) => s.activeBranchId);
  const branch      = branches.find((b) => b.id === branchId) ?? null;
  const isMulti     = branches.filter((b) => b.is_active).length > 1;

  return { branchId, branch, branches, isMulti };
}
