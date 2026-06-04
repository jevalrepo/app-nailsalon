import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { getDb } from '@/lib/db/database';
import type { Organization, TenantRole } from '@/types';

const AUTH_BOOT_TIMEOUT_MS = 1500;
const REMOTE_DATA_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .then(undefined, () => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

export function useSession() {
  const {
    session, profile, isLoading,
    setSession, setProfile, setLoading, clear,
    setOrganizations, setActiveOrganization, clearActiveOrganization, setOrgsLoaded,
  } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const result = await withTimeout(supabase.auth.getSession(), AUTH_BOOT_TIMEOUT_MS);
      if (!mounted) return;

      if (!result) {
        setLoading(false);
        return;
      }

      const session = result.data.session;
      setSession(session);
      if (session) {
        clearActiveOrganization();
        setOrgsLoaded(false);
        refreshUserData(session.user.id);
      } else {
        clear();
      }
      setLoading(false);
    }

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      if (session) {
        clearActiveOrganization();
        setOrgsLoaded(false);
        setTimeout(() => {
          refreshUserData(session.user.id);
        }, 0);
      } else {
        clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function refreshUserData(userId: string) {
    void fetchProfile(userId);
    void loadOrganizations(userId);
  }

  async function fetchProfile(userId: string) {
    try {
      const db = getDb();
      const local = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE id = ? LIMIT 1',
        [userId]
      );
      if (local) {
        setProfile(local as any);
      }
    } catch {
      // SQLite no disponible — caer a Supabase
    }

    const result = await withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      REMOTE_DATA_TIMEOUT_MS
    );

    const data = result?.data;
    if (data) {
      setProfile(data);
      try {
        const db = getDb();
        await db.runAsync(
          `INSERT OR REPLACE INTO profiles
             (id, full_name, role, phone, avatar_url, organization_id, is_active, created_at, _synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            data.id, data.full_name, data.role, data.phone ?? null,
            data.avatar_url ?? null, data.organization_id ?? null,
            data.is_active ? 1 : 0, data.created_at,
          ]
        );
      } catch {
        // No crítico
      }
    }
  }

  async function loadOrganizations(userId: string) {
    const result = await withTimeout(
      supabase
        .from('organization_members')
        .select('organization_id, role, organizations(id, name, slug, plan, is_active, created_at, logo_url)')
        .eq('user_id', userId)
        .eq('is_active', true),
      REMOTE_DATA_TIMEOUT_MS
    );

    const members = result?.data;
    const error = result?.error;

    if (error || !members || members.length === 0) return;

    const orgs: Organization[] = [];
    const roleMap: Record<string, TenantRole> = {};

    for (const m of members) {
      const org = m.organizations as unknown as Organization | null;
      if (org && org.is_active) {
        orgs.push(org);
        roleMap[org.id] = m.role as TenantRole;
      }
    }

    setOrganizations(orgs, roleMap);

    // Con 1 org: auto-seleccionar. Con 2+: limpiar para forzar org-select
    if (orgs.length === 1) {
      setActiveOrganization(orgs[0].id, roleMap[orgs[0].id]);
    } else {
      clearActiveOrganization();
    }

    setOrgsLoaded(true);
  }

  return { session, profile, isLoading };
}
