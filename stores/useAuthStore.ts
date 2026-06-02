import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { Organization, TenantRole, Branch } from '@/types';

export type UserRole = 'admin' | 'employee';

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  organization_id: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  // SaaS multi-tenant
  organizations: Organization[];
  organizationRoles: Record<string, TenantRole>;
  activeOrganizationId: string | null;
  activeOrganizationRole: TenantRole | null;
  // Branches
  branches: Branch[];
  activeBranchId: string | null;
  // Auth actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  // Org actions
  setOrganizations: (orgs: Organization[], roles?: Record<string, TenantRole>) => void;
  setActiveOrganization: (orgId: string, role: TenantRole) => void;
  // Branch actions
  setBranches: (branches: Branch[]) => void;
  setActiveBranch: (branchId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      organizations: [],
      organizationRoles: {},
      activeOrganizationId: null,
      activeOrganizationRole: null,
      branches: [],
      activeBranchId: null,

      setSession: (session) =>
        set({ session, user: session?.user ?? null }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      clear: () =>
        set({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          organizations: [],
          organizationRoles: {},
          activeOrganizationId: null,
          activeOrganizationRole: null,
          branches: [],
          activeBranchId: null,
        }),

      setOrganizations: (organizations, roles) =>
        set({ organizations, ...(roles ? { organizationRoles: roles } : {}) }),

      setActiveOrganization: (orgId, role) =>
        set({ activeOrganizationId: orgId, activeOrganizationRole: role, branches: [], activeBranchId: null }),

      setBranches: (branches) => {
        const active = useAuthStore.getState().activeBranchId;
        const stillValid = active && branches.some(b => b.id === active);
        if (stillValid) {
          set({ branches });
        } else if (branches.length === 1) {
          set({ branches, activeBranchId: branches[0].id });
        } else {
          set({ branches, activeBranchId: null });
        }
      },

      setActiveBranch: (branchId) => set({ activeBranchId: branchId }),
    }),
    {
      name: 'coraline-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        organizations: state.organizations,
        organizationRoles: state.organizationRoles,
        activeOrganizationId: state.activeOrganizationId,
        activeOrganizationRole: state.activeOrganizationRole,
        branches: state.branches,
        activeBranchId: state.activeBranchId,
      }),
      // Al rehydratar: si hay 1 sola sucursal y activeBranchId es null, auto-seleccionarla.
      // Esto evita pantallas vacías en el primer arranque después de instalar una actualización.
      onRehydrateStorage: () => (state) => {
        if (state && !state.activeBranchId && state.branches.length === 1) {
          state.activeBranchId = state.branches[0].id;
        }
      },
    }
  )
);
