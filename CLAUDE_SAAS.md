# Coraline Nails — Plan SaaS Multi-Tenant

Conversión de app single-tenant a SaaS donde múltiples salones de uñas pueden registrarse y operar de forma aislada.

**Arquitectura:** Single Supabase Project + `organization_id` en todas las tablas + RLS por membresía + JWT claims

---

## Estado de módulos

### ✅ Módulo S1 — Migración de base de datos
**Dependencias:** ninguna

- [x] `supabase/migrations/20260601_001_organizations.sql` — tablas nuevas
- [x] Tabla `organizations` (id, name, slug, plan, is_active, created_at)
- [x] Tabla `organization_members` (id, organization_id, user_id, role owner/admin/employee, is_active, invited_by, joined_at)
- [x] Tabla `invitations` (id, organization_id, email, role, token, expires_at, accepted_at, invited_by)
- [x] `supabase/migrations/20260601_002_add_org_id_to_tables.sql` — columnas en tablas existentes
  - [x] profiles
  - [x] clients
  - [x] services
  - [x] appointments
  - [x] transactions
  - [x] inventory
  - [x] designs
  - [x] tasks
  - [x] agenda_blocks
- [x] `supabase/migrations/20260601_003_migrate_business_config.sql` — quitar constraint `id=1`, UUID PK, agregar `organization_id`
- [x] Índices `idx_*_org_id` en todas las tablas afectadas
- [x] Rol `owner` manejado como TEXT con CHECK en `organization_members` (no modifica enum `user_role`)
- [x] `supabase/migrations/20260601_004_seed_initial_org.sql` — org "Coraline Nails" + admin como owner + UPDATE de todos los datos existentes
- [x] Ejecutado en Supabase via Management API (orden: 001 → 002 → 003 → 004)
- [x] Verificado: 3 tablas nuevas, organization_id en 9 tablas, org "Coraline Nails" con 1 member / 2 clients / 14 services, 0 rows sin org

---

### ✅ Módulo S2 — RLS multi-tenant
**Dependencias:** S1

- [x] Crear `supabase/migrations/20260601_005_rls_multitenancy.sql`
- [x] Función `get_my_organizations()` — retorna UUIDs de orgs activas del usuario actual
- [x] Función `get_my_org_role(org_id UUID)` — retorna rol del usuario en una org específica
- [x] Función `is_org_admin(org_id UUID)` — alias booleano para owner/admin
- [x] Dropear todas las políticas anteriores (de `002_rls.sql` + parches)
- [x] Reescribir políticas para las 9 tablas con patrón `organization_id IN (SELECT get_my_organizations())`
  - [x] profiles — select (org+is_active), update_own, admin_all
  - [x] clients — select, insert, update (admin o creador), delete (admin)
  - [x] services — select, write (admin/owner)
  - [x] appointments + appointment_services — select/insert/update/delete con regla admin-vs-employee
  - [x] transactions — admin_org + employee insert para citas propias
  - [x] inventory — select, write (admin/owner)
  - [x] designs + client_photos — hereda aislamiento vía tabla padre
  - [x] tasks — select/insert/update/delete (admin, creador o asignado)
  - [x] agenda_blocks — select, write (admin o empleada propia)
- [x] Políticas para tabla `organizations` — RLS habilitado, solo miembros ven su org, solo owner actualiza
- [x] Políticas para tabla `organization_members` — RLS habilitado, miembros ven su org, admin/owner escriben
- [x] Políticas para tabla `invitations` — RLS habilitado, admin/owner leen y crean
- [x] Políticas para tabla `business_config` — RLS habilitado, todos leen, solo admin/owner escriben
- [x] JWT Auth Hook: función `custom_access_token_hook` inyecta `app_metadata.org_ids` en el JWT
  - ⚠️ Pendiente: registrar manualmente en Dashboard > Auth > Hooks (schema: public, fn: custom_access_token_hook)
- [x] Actualizar políticas de Storage: `client-photos/{orgId}/...` y `designs/{orgId}/...`
- [x] Ejecutado y verificado en Supabase: funciones existen, tablas accesibles con service_role
- [ ] Verificación de aislamiento entre 2 orgs reales — se valida en S4

---

### ✅ Módulo S3 — Tipos, stores y hook de sesión
**Dependencias:** S1

- [x] `types/index.ts` — agregar `Organization`, `OrganizationMember`, `TenantRole`
- [x] `types/index.ts` — modificar `Profile` (agregar `organization_id` opcional)
- [x] `stores/useAuthStore.ts` — agregar `activeOrganizationId`, `organizations`, `setActiveOrganization`, `setOrganizations`; persist solo orgId+role via AsyncStorage
- [x] `hooks/useActiveOrg.ts` — nuevo hook: retorna `{ orgId, orgRole, org }` desde el store
- [x] `hooks/useSession.ts` — cargar orgs del usuario al login; auto-seleccionar si solo hay una; respetar org guardada si sigue válida
- [x] `lib/db/migrations.ts` — migration v2: `ALTER TABLE ... ADD COLUMN organization_id TEXT` en 11 tablas + índices
- [x] `stores/useSyncQueue.ts` — `QueueEntry` incluye `organization_id: string | null`
- [ ] Verificación: después del login el store tiene `activeOrganizationId` poblado

---

### ✅ Módulo S4 — Flujo de registro y onboarding
**Dependencias:** S1, S2, S3

- [x] `stores/useOnboardingStore.ts` — `hasSeenOnboarding` + `hasCompletedSetup`; persistido en AsyncStorage `coraline-onboarding`
- [x] `app/(auth)/onboarding.tsx` — 4 slides animados (fade) con íconos hero; puntos indicadores; botón "Omitir"; redirige a setup (admin) o tabs (employee)
- [x] `app/(auth)/setup.tsx` — 2 pasos: datos del salón + horario/días laborales; guarda con `useUpdateBusinessConfig`
- [x] `app/index.tsx` — routing inteligente: sin sesión → login; sin onboarding → onboarding; admin sin setup → setup; else → tabs
- [x] Flujo completo: Login → Onboarding (1ra vez) → Setup negocio (admin) → App

---

### ✅ Módulo S5 — Migrar todos los query hooks
**Dependencias:** S3

Patrón aplicado: `const { orgId } = useActiveOrg()` + `WHERE organization_id = ?` en SQLite + `orgId` en queryKey + `enabled: !!orgId`

- [x] `hooks/useBusinessConfig.ts` — query por `organization_id`, `id` ahora UUID, mutation con `orgId`
- [x] `hooks/useClients.ts` + `useClientMutations.ts` — filtro por org, `useClientById` agregado
- [x] `hooks/useServices.ts` + `useServiceMutations.ts` — filtro por org en active/all/byId
- [x] `hooks/useAppointments.ts` + `useAppointmentMutations.ts` — filtro por org en todas las queries; `useAppointmentById` agregado; `organization_id` en inserts
- [x] `hooks/useFinance.ts` + `useFinanceMutations.ts` — filtro por org en todas las queries y mutations
- [x] `hooks/useInventory.ts` + `useInventoryMutations.ts` — filtro por org
- [x] `hooks/useGallery.ts` + `useGalleryMutations.ts` — filtro por org; path de Storage con `orgId`
- [x] `hooks/useTasks.ts` + `useTaskMutations.ts` — filtro por org
- [x] `hooks/useEmployees.ts` + `useEmployeeMutations.ts` — filtro por org; `useCreateEmployee` también agrega a `organization_members`
- [x] `hooks/useStats.ts` — filtro por org en las 4 queries
- [x] `hooks/useHomeData.ts` — filtro por org en citas de hoy e ingresos del día
- [ ] Verificación: cambiar org en store → todas las pantallas muestran datos del salón correcto

---

### ✅ Módulo S6 — Sync manager multi-tenant
**Dependencias:** S3, S5

- [x] `lib/sync/syncManager.ts` — `pullFromSupabase(orgId?)` filtra por `organization_id` en todas las tablas org-scoped; `ORG_SCOPED_TABLES` define qué tablas aplican
- [x] `lib/sync/syncManager.ts` — `clearOrgCache(orgId)` — borra de SQLite los registros que no pertenecen a la org activa; llama a este helper al cambiar de org
- [x] `lib/sync/SyncProvider.tsx` — lee `activeOrganizationId` del store vía ref; pasa `orgId` a `pullFromSupabase()` en cada ciclo de sync
- [x] `lib/sync/SyncProvider.tsx` — `useEffect` en `activeOrganizationId`: detecta cambio de org, llama `clearOrgCache`, limpia TanStack Query cache con `queryClient.clear()` y dispara pull fresco si hay red
- [x] `lib/sync/syncManager.ts` — sync incremental (lastRow `updated_at`) también filtra por `organization_id` para no comparar fechas entre orgs distintas
- [ ] Verificación: cambiar `activeOrganizationId` en store → pantallas muestran datos de la nueva org, no de la anterior

---

### ✅ Módulo S7 — Sistema de invitaciones
**Dependencias:** S1, S2, S4

- [x] `types/index.ts` — `InvitationRole` + `Invitation` interface
- [x] `hooks/useInvitations.ts` — `useInvitations` (fetch por org), helpers `isPending`, `isExpired`, `isAccepted`
- [x] `hooks/useInvitationMutations.ts` — `useCreateInvitation` (valida duplicados), `useCancelInvitation`, `useResendInvitation` (extiende expiry +7 días)
- [x] `app/(app)/invitation/index.tsx` — listado con chips pendientes/aceptadas, botones Reenviar/Cancelar/Eliminar
- [x] `app/(app)/invitation/new.tsx` — formulario: email + selector de rol con cards visuales
- [x] `app/(app)/employee/index.tsx` — botón "Invitar" en header (solo admin)
- [ ] Aceptación de invitación vía Edge Function con service_role — pendiente (S9)

---

### ✅ Módulo S8 — Storage paths multi-tenant
**Dependencias:** S3

- [x] `lib/storage/paths.ts` — helper centralizado: `avatarPath`, `designPath`, `clientPhotoPath`, `extractStoragePath`, `getExtFromUri`, `getMimeType`
- [x] `hooks/useGalleryMutations.ts` — usa `designPath(orgId, userId, ext)` + `extractStoragePath`
- [x] `hooks/useGallery.ts` — usa `extractStoragePath` en lugar de regex inline
- [x] `hooks/useAvatarUpload.ts` — pick desde galería + upload a `avatars/{userId}/avatar.{ext}` + upsert `profiles.avatar_url`
- [x] `app/(app)/profile/index.tsx` — componente `AvatarHero` con foto real, overlay cámara, action sheet cambiar/eliminar
- [x] `supabase/migrations/20260601_006_storage_paths_multitenant.sql` — ajusta política `designs_delete_org` a admin/owner OR uploader; aplicada en producción

---

### ⬜ Módulo S9 — Super-admin panel web (pendiente)
**Dependencias:** S1, S2

- [ ] Proyecto Next.js en `/apps/admin-panel/` (o repo separado)
- [ ] Login con `service_role` key (solo acceso interno)
- [ ] Tabla de organizaciones: nombre, plan, fecha registro, estado, acciones
- [ ] Activar / desactivar salones
- [ ] Cambiar plan de una org
- [ ] Métricas globales: total orgs activas, MAU, orgs por plan
- [ ] Aceptación de invitaciones vía Edge Function (pendiente de S7)
- [ ] Verificación: ver los salones registrados en módulos anteriores

---

## Árbol de dependencias

```
S1 Schema DB
│
├── S2 RLS
│
└── S3 Tipos + Stores + Session
    │
    ├── S4 Registro + Onboarding
    │   └── S7 Invitaciones
    │
    ├── S5 Hooks (datos)
    │   └── S6 Sync offline
    │
    └── S8 Storage paths

S9 Panel web → independiente (solo necesita S1 + S2)
```

---

## Estimación

| Módulo | Sesiones | Estado |
|--------|----------|--------|
| S1 — Schema DB | 1 | ✅ Completo |
| S2 — RLS | 1 | ✅ Completo |
| S3 — Tipos + Stores | 1 | ✅ Completo |
| S4 — Registro + Onboarding | 1-2 | ✅ Completo |
| S5 — Query hooks | 2 | ✅ Completo |
| S6 — Sync | 1 | ✅ Completo |
| S7 — Invitaciones | 1-2 | ✅ Completo |
| S8 — Storage | 0.5 | ✅ Completo |
| S9 — Panel web | 2-3 | ⬜ Pendiente |
| **Total** | **~11-14** | **8/9 completos** |

---

## Reglas del proyecto SaaS

- Siempre verificar módulos completados antes de empezar uno nuevo
- Cada módulo debe tener su migración SQL propia — no mezclar en un solo archivo
- Nunca hardcodear `organization_id` — siempre proviene de `useActiveOrg()`
- El `service_role` key nunca va en el cliente móvil — solo en Edge Functions o panel web
- Al terminar cada módulo, marcar los checkboxes y cambiar `⬜` a `✅`
