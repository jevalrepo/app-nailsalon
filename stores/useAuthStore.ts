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
  orgsLoaded: boolean; // true cuando loadOrganizations terminó
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
  clearActiveOrganization: () => void;
  setOrgsLoaded: (loaded: boolean) => void;
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
      orgsLoaded: false,
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
          orgsLoaded: false,
          branches: [],
          activeBranchId: null,
        }),

      setOrganizations: (organizations, roles) =>
        set({ organizations, ...(roles ? { organizationRoles: roles } : {}) }),

      setActiveOrganization: (orgId, role) =>
        set({ activeOrganizationId: orgId, activeOrganizationRole: role, branches: [], activeBranchId: null }),

      clearActiveOrganization: () =>
        set({ activeOrganizationId: null, activeOrganizationRole: null, branches: [], activeBranchId: null }),

      setOrgsLoaded: (orgsLoaded) => set({ orgsLoaded }),

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
        // orgsLoaded NO se persiste — siempre arranca en false
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.activeBranchId && state.branches.length === 1) {
          state.activeBranchId = state.branches[0].id;
        }
      },
    }
  )
);
