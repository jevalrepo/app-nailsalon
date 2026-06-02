import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { Organization, TenantRole } from '@/types';

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
  activeOrganizationId: string | null;
  activeOrganizationRole: TenantRole | null;
  // Auth actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  // Org actions
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrganization: (orgId: string, role: TenantRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      organizations: [],
      activeOrganizationId: null,
      activeOrganizationRole: null,

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
          activeOrganizationId: null,
          activeOrganizationRole: null,
        }),

      setOrganizations: (organizations) => set({ organizations }),

      setActiveOrganization: (orgId, role) =>
        set({ activeOrganizationId: orgId, activeOrganizationRole: role }),
    }),
    {
      name: 'coraline-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // La sesión la maneja Supabase Auth; perfil/orgs son cache de UI para arrancar rápido.
      partialize: (state) => ({
        profile: state.profile,
        organizations: state.organizations,
        activeOrganizationId: state.activeOrganizationId,
        activeOrganizationRole: state.activeOrganizationRole,
      }),
    }
  )
);
