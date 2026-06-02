@AGENTS.md

# Coraline Nails — Plan de desarrollo

App de gestión para negocio de uñas.

**Stack:** React Native + Expo 54 + TypeScript + NativeWind v4 + Expo Router + Zustand + TanStack Query + Supabase

**Colores:** Coral `#F4A99A` (brand), paleta de acentos: lavender, blush, mint, sky, peach

---

## Estado de módulos

### ✅ Módulo 0 — Setup y arquitectura
- Expo 54 + NativeWind v4 + newArchEnabled: true
- Expo Router, Zustand, TanStack Query, Supabase client
- `constants/colors.ts`, `constants/theme.ts`
- Stores: `useThemeStore`, `usePreferencesStore`, `useAuthStore`

### ✅ Módulo 1 — Base de datos y Storage
- 11 tablas en Supabase con RLS por rol
- 3 buckets en Storage
- Usuario admin: valdezgzz.22@gmail.com (rol `admin` en `profiles`)
- Seed: 7 servicios + 10 items de inventario (quedaron duplicados x2 — pendiente limpiar)

### ✅ Módulo 2 — Autenticación
- `app/(auth)/login.tsx` — pantalla minimalista con diseño coral
- `hooks/useSession.ts` — listener de Supabase Auth + fetch de profile
- `app/(app)/_layout.tsx` — guard que redirige a login si no hay sesión
- `app/index.tsx` — auto-redirect si hay sesión activa
- Logout con confirmación en tab "Más" (`app/(app)/(tabs)/more.tsx`)

### ✅ Módulo 3 — Sistema de diseño
- `hooks/useTheme.ts` — resuelve light/dark/system + accent color
- `components/ui/Button.tsx` — variantes: primary, secondary, ghost, destructive + loading
- `components/ui/Input.tsx` — label, error, helper, isPassword, focus con accent
- `components/ui/Card.tsx` — variantes: flat, elevated, outlined
- `components/ui/Badge.tsx` — variantes: success, warning, error, neutral, accent
- `components/ui/Avatar.tsx` — iniciales con color determinístico + foto via uri
- `components/ui/Modal.tsx` — fade, backdrop, preventBackdropClose
- `components/ui/BottomSheet.tsx` — spring animation + pan gesture para cerrar
- `components/ui/index.ts` — barrel export

### ✅ Módulo 4 — Pantallas principales (tabs)
- `app/(app)/(tabs)/index.tsx` — Inicio: saludo, stat cards (citas de hoy + ingresos del día), agenda del día
- `app/(app)/(tabs)/appointments.tsx` — Citas: selector de 7 días deslizables, lista con estado/pago/monto
- `app/(app)/(tabs)/clients.tsx` — Clientas: búsqueda en tiempo real, avatar con color determinístico, badge de faltas
- `app/(app)/(tabs)/finance.tsx` — Finanzas: selector mes/año, tarjetas ingresos/gastos/neto, transacciones recientes
- `app/(app)/(tabs)/_layout.tsx` — iconos Ionicons filled/outline según tab activo
- `hooks/useHomeData.ts` — queries: citas de hoy + ingresos del día
- `hooks/useAppointments.ts` — query: citas por fecha
- `hooks/useClients.ts` — query: clientes con búsqueda ilike
- `hooks/useFinance.ts` — queries: resumen mensual + transacciones recientes

---

## Próximos módulos

### ✅ Módulo 5 — Citas (CRUD completo)
- `hooks/useServices.ts` — fetch servicios activos
- `hooks/useEmployees.ts` — fetch profiles (empleadas)
- `hooks/useAppointmentMutations.ts` — crear, editar, cancelar, completar, no_show
- `app/(app)/appointment/new.tsx` — flujo de 5 pasos: cliente → servicios → fecha/hora → empleada → notas+resumen
- `app/(app)/appointment/[id].tsx` — detalle: info, servicios, notas editables, acciones por estado
- `app/(app)/(tabs)/appointments.tsx` — botón + en header, tap en cita → detalle, empty state con CTA
- Notificaciones de recordatorio — pendiente (requiere dependencia nueva)

### ✅ Módulo 6 — Clientes (CRUD completo)
- `hooks/useClientMutations.ts` — crear, editar, eliminar cliente
- `app/(app)/client/new.tsx` — formulario de nueva clienta (nombre, teléfono, email, cumpleaños, notas)
- `app/(app)/client/[id].tsx` — detalle: perfil con avatar, stats (visitas/total gastado/última visita), info de contacto, notas, historial de citas navegable, editar en modal, eliminar con confirmación
- `app/(app)/(tabs)/clients.tsx` — botón + en header, tap en row navega a detalle, empty state con CTA, ícono Ionicons en búsqueda

### ✅ Módulo 7 — Servicios
- `hooks/useServices.ts` — refactorizado: `useServices` (solo activos, para citas), `useAllServices` (todos), `useServiceById`
- `hooks/useServiceMutations.ts` — `useCreateService`, `useUpdateService`, `useToggleServiceActive`
- `app/(app)/(tabs)/services.tsx` — tab listado con secciones por categoría, contador de activos, botón + para admin
- `app/(app)/service/new.tsx` — formulario: nombre, descripción, precio, selector de categoría y duración
- `app/(app)/service/[id].tsx` — detalle con hero card, precio/duración, toggle activo (admin), edición en pantalla
- Tab "Servicios" agregado al layout entre "Clientas" y "Finanzas"

### ✅ Módulo 8 — Finanzas
- `hooks/useFinanceMutations.ts` — `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`
- `hooks/useFinance.ts` — ampliado: `useMonthTransactions`, `useTransactionById`, `useMonthCategorySummary`, `useDayCashClose`
- `app/(app)/finance/new.tsx` — formulario nueva transacción: tipo (ingreso/egreso), monto, descripción, categoría, método de pago, fecha
- `app/(app)/finance/[id].tsx` — detalle con hero card, info de transacción, edición in-screen, eliminar con confirmación
- `app/(app)/finance/close.tsx` — cierre de caja: selector de días con movimientos, desglose por método (efectivo/tarjeta/transferencia), balance del día
- `app/(app)/(tabs)/finance.tsx` — refactorizado: botón + en header, botón cierre de caja, transacciones agrupadas por día con tap → detalle, empty state con CTA

### ✅ Módulo 9 — Inventario
- `hooks/useInventory.ts` — `useInventory` (todos), `useInventoryItem` (por id), helper `isLowStock`
- `hooks/useInventoryMutations.ts` — `useCreateInventoryItem`, `useUpdateInventoryItem`, `useDeleteInventoryItem`
- `app/(app)/(tabs)/inventory.tsx` — listado con búsqueda, badge de "Bajo stock" en rojo, contador de alertas en header
- `app/(app)/inventory/new.tsx` — formulario: nombre, cantidad, stock mínimo, selector de unidad, tip informativo
- `app/(app)/inventory/[id].tsx` — detalle con hero card (rojo si bajo stock), edición in-screen, eliminar con confirmación
- Tab "Inventario" agregado al layout entre "Servicios" y "Finanzas"

### ✅ Módulo 10 — Galería de diseños
- `expo-image-picker` — selección desde carrete o cámara
- `hooks/useGallery.ts` — `useGallery` (fetch con signed URLs batch), `useDesignById` (signed URL individual)
- `hooks/useGalleryMutations.ts` — `useUploadDesign` (upload a Storage + insert en designs), `useDeleteDesign` (delete DB + Storage)
- `app/(app)/gallery/index.tsx` — grid 2 columnas, filtro de tags horizontal deslizable, empty state con CTA
- `app/(app)/gallery/new.tsx` — picker cámara/galería, título, tags preset + personalizados
- `app/(app)/gallery/[id].tsx` — imagen hero full-width, tags, botón eliminar (admin o dueño)
- `app/(app)/inventory/index.tsx` — listado con búsqueda, badge bajo stock (pantalla de stack, no tab)
- Galería e Inventario se acceden desde el menú "Más" → `router.push('/gallery')` / `router.push('/inventory')`
- NO son tabs — son pantallas de stack dentro de `(app)`

### ✅ Módulo 11 — Tareas
- `hooks/useTasks.ts` — `useTasks` (con filtros: all/pending/completed/mine), `useTaskById`, helper `isOverdue`
- `hooks/useTaskMutations.ts` — `useCreateTask`, `useUpdateTask`, `useToggleTask`, `useDeleteTask`
- `app/(app)/task/index.tsx` — listado con filtros chip (Todas/Pendientes/Mis tareas/Completadas), checkbox toggle inline, badge contador de pendientes, empty state por filtro, eliminar con confirmación
- `app/(app)/task/new.tsx` — formulario: título, fecha límite con shortcuts (Hoy/Mañana/3d/1sem), asignación a empleada
- `app/(app)/task/[id].tsx` — hero card de estado (completada/vencida/pendiente), edición in-screen, toggle completar/reabrir, eliminar con confirmación
- `app/(app)/(tabs)/more.tsx` — Tareas conectado con `router.push('/task')`
- Tareas se accede desde el menú "Más" → `router.push('/task')`
- NO es tab — es pantalla de stack dentro de `(app)`

### ✅ Módulo 12 — Estadísticas
- `hooks/useStats.ts` — `useMonthlyRevenue` (últimos 6 meses), `useTopServices`, `useTopClients`, `useStatsSummary`
- `app/(app)/stats/index.tsx` — pantalla con selector mes/año, 6 KPI cards (ingresos/gastos/neto/completadas/clientas/no-show), gráfico de barras de ingresos sin librería externa, top 5 servicios con barra de progreso, top 5 clientas frecuentes
- `app/(app)/(tabs)/more.tsx` — Estadísticas conectado con `router.push('/stats')`
- Se accede desde el menú "Más" → `router.push('/stats')`
- NO es tab — es pantalla de stack dentro de `(app)`

### ✅ Módulo 13 — Empleadas
- `hooks/useEmployees.ts` — refactorizado: `useEmployees` (todas), `useEmployeeById`, `useEmployeeStats` (citas mes + completadas + ingresos)
- `hooks/useEmployeeMutations.ts` — `useCreateEmployee` (auth.admin.createUser + upsert profile), `useUpdateEmployee`, `useChangeEmployeeRole`
- `app/(app)/employee/index.tsx` — listado con chips de totales (total/admins/staff), empty state con CTA, solo admin ve el botón +
- `app/(app)/employee/new.tsx` — formulario: nombre, teléfono, email, contraseña temporal, selector de rol con descripción
- `app/(app)/employee/[id].tsx` — hero card con avatar, 3 stat cards (citas mes/completadas/ingresos), info + edición in-screen, toggle de rol (admin → employee y viceversa), se oculta en la propia cuenta
- `app/(app)/(tabs)/more.tsx` — "Empleadas" conectado en sección Administración (solo admin)
- Se accede desde el menú "Más" → `router.push('/employee')` (solo admin)
- NO es tab — es pantalla de stack dentro de `(app)`

### ✅ Módulo 14 — Panel de administración
- `app/(app)/admin/index.tsx` — panel principal: KPIs del mes (clientas, completadas, tasa, no-show), cards de acceso a Usuarios/Roles/Config/Stats, accesos rápidos a Inventario, Servicios, Finanzas, Tareas, Galería
- `app/(app)/admin/users.tsx` — gestión de usuarios y roles: listado de empleadas, chips resumen (total/admins/staff), toggle de rol con confirmación via `useChangeEmployeeRole`, nota informativa, navega a detalle de empleada
- `app/(app)/admin/config.tsx` — configuración global del negocio: nombre, teléfono, dirección, Instagram, horario apertura/cierre, días laborales, moneda, anticipación de recordatorios; persistencia en AsyncStorage con clave `coraline-business-config`
- Guardado con confirmación y manejo de errores; carga inicial desde AsyncStorage
- `app/(app)/(tabs)/more.tsx` — "Panel de administración" conectado con `router.push('/admin')`
- Solo visible/accesible para `role === 'admin'`; Redirect a tabs si no es admin

### ✅ Módulo 15 — Perfil y preferencias
- `app/(app)/profile/index.tsx` — pantalla con avatar hero (iniciales), 3 secciones: Apariencia, Información personal, Seguridad
- Apariencia: selector de tema (claro/oscuro/sistema) con chips visuales + selector de color de acento con dots circulares y checkmark; persiste en `useThemeStore` (AsyncStorage `coraline-theme`)
- Información personal: edición de nombre y teléfono con guardado en Supabase `profiles`; botón "Guardar cambios" aparece solo cuando hay cambios sin guardar
- Seguridad: cambio de contraseña con 3 campos (actual, nueva, confirmar) + toggle show/hide; usa `supabase.auth.updateUser`; botón deshabilitado hasta que coincidan y tengan ≥6 chars
- `app/(app)/(tabs)/more.tsx` — "Perfil y preferencias" conectado con `router.push('/profile')`
- Se accede desde el menú "Más" → stack `(app)`, NO es tab

### ✅ Módulo 16 — Recargo fuera de horario por servicio
- Migración Supabase: `applies_surcharge` (boolean, default false) en `services`; `off_hours_surcharge_type` ('fixed'|'percent', default 'fixed') en `business_config`
- `types/index.ts` — `applies_surcharge: boolean` agregado a `Service`
- `hooks/useServices.ts` — queries actualizados para incluir `applies_surcharge`
- `hooks/useServiceMutations.ts` — `ServicePayload` incluye `applies_surcharge?`
- `hooks/useBusinessConfig.ts` — `BusinessConfig` incluye `off_hours_surcharge_type`
- `app/(app)/admin/config.tsx` — sección "Recargo fuera de horario": selector Monto fijo / Porcentaje + campo de valor
- `app/(app)/service/new.tsx` — toggle "Aplica recargo" al crear servicio
- `app/(app)/service/[id].tsx` — badge de recargo en vista detalle + toggle en modo edición
- `app/(app)/appointment/new.tsx` — recargo calculado solo si cita es fuera de horario Y al menos un servicio tiene `applies_surcharge:true`; soporta % y monto fijo; muestra desglose subtotal + recargo + total en resumen

### ✅ Módulo 17 — Offline-First (sin servicios externos)
- `expo-sqlite` como DB local + `@react-native-community/netinfo` para detección de red
- `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` instalados
- `lib/db/migrations.ts` — 11 tablas espejando Supabase + `design_cache` (local-only) + columnas `_synced`, `_deleted`, `updated_at`
- `lib/db/database.ts` — singleton `initDatabase()` + `getDb()`, aplica migrations al arrancar
- `stores/useSyncQueue.ts` — cola Zustand persistida en AsyncStorage (`coraline-sync-queue`); `QueueEntry` con `dependsOn` para multi-tabla
- `lib/sync/syncManager.ts` — `processSyncQueue()` (sube cola a Supabase, FIFO, max 3 reintentos) + `pullFromSupabase()` (sync incremental por `updated_at`)
- `hooks/useNetworkStatus.ts` — wrapper de NetInfo
- `lib/sync/SyncProvider.tsx` — Context Provider; sync automático al pasar offline→online y al montar con sesión activa
- **Todos los query hooks** migrados a SQLite local (`db.getAllAsync`, `db.getFirstAsync`)
- **Todos los mutation hooks** con patrón local-first: escribe SQLite → si online sube a Supabase, si offline encola
- `useBookedSlots` — reemplaza RPC `get_booked_slots()` con SQL local JOIN
- `hooks/useGallery.ts` — lee de SQLite + `design_cache` para signed URLs con TTL 50min; refresh en background al abrir con conexión
- `hooks/useGalleryMutations.ts` — upload/delete siguen siendo online-only (Storage requiere red); guardan fila en SQLite local tras subir
- `components/ui/SyncStatusBadge.tsx` — chip de estado (sin conexión / N pendientes / sincronizando); visible en header del tab bar
- `app/_layout.tsx` — `initDatabase()` al arrancar, `<SyncProvider>` envuelve la app, `QueryClient` actualizado (staleTime 1h, retry 0, gcTime 24h)
- `app/(app)/(tabs)/_layout.tsx` — `SyncStatusBadge` en `headerRight` de todos los tabs
- `app/(app)/employee/new.tsx` — botón "Crear empleada" deshabilitado sin conexión (auth.admin solo online)
- `app/(app)/gallery/new.tsx` — botón "Guardar" deshabilitado sin conexión
- `app/(app)/gallery/[id].tsx` — botón eliminar deshabilitado sin conexión

### ✅ Módulo S4 — Registro y Onboarding
- `stores/useOnboardingStore.ts` — `hasSeenOnboarding` + `hasCompletedSetup`; persistido en AsyncStorage `coraline-onboarding`
- `app/(auth)/onboarding.tsx` — 4 slides animados (fade) con íconos hero: Agenda, Clientas, Finanzas, Todo en un lugar; puntos indicadores expandibles; botón "Omitir"; redirige a setup si es admin, a tabs si es empleada
- `app/(auth)/setup.tsx` — 2 pasos: (1) Nombre del salón, teléfono, dirección, Instagram; (2) Días laborales con chips interactivos, hora apertura/cierre con stepper ±30 min; guarda con `useUpdateBusinessConfig`; botón "Ahora no" para saltar
- `app/index.tsx` — routing inteligente: sin sesión → login; sin onboarding → onboarding; admin sin setup → setup; else → tabs
- Flujo completo: Login → Onboarding (1ra vez) → Setup negocio (admin) → App

### ✅ Módulo S7 — Invitaciones
- `types/index.ts` — `InvitationRole` + `Invitation` interface
- `hooks/useInvitations.ts` — `useInvitations` (fetch por org), helpers `isPending`, `isExpired`, `isAccepted`
- `hooks/useInvitationMutations.ts` — `useCreateInvitation` (valida duplicados pendientes), `useCancelInvitation` (delete), `useResendInvitation` (extiende expiry +7 días)
- `app/(app)/invitation/index.tsx` — listado con chips (pendientes/aceptadas), cards con estado, botón "Reenviar" y "Cancelar" en pendientes, botón "Eliminar" en vencidas
- `app/(app)/invitation/new.tsx` — formulario: email + selector de rol (Empleada/Administradora) con cards visuales, banner informativo de 7 días de vigencia
- `app/(app)/employee/index.tsx` — botón "Invitar" (mail-outline + texto) en header junto al botón +; solo admin lo ve
- Flujo: Empleadas → "Invitar" → listado de invitaciones → "+" nueva → formulario → invitación creada en Supabase
- Invitación aceptada: manejo vía Edge Function con service_role (pendiente: S8 o deploy flow)
- NO es tab — pantalla de stack dentro de `(app)`, acceso desde `employee/index.tsx`

### ✅ Módulo S8 — Storage paths multi-tenant
- `lib/storage/paths.ts` — helper centralizado: `avatarPath`, `designPath`, `clientPhotoPath`, `extractStoragePath`, `getExtFromUri`, `getMimeType`
- Convenciones de paths:
  - `avatars` → `{userId}/avatar.{ext}` (público, por usuario)
  - `designs` → `{orgId}/{userId}/{timestamp}.{ext}` (privado, por org)
  - `client-photos` → `{orgId}/{clientId}/{timestamp}.{ext}` (privado, por org)
- `hooks/useGalleryMutations.ts` — refactorizado para usar `designPath` + `extractStoragePath` del helper
- `hooks/useGallery.ts` — refactorizado para usar `extractStoragePath` del helper
- `hooks/useAvatarUpload.ts` — pick desde galería + upload al bucket `avatars` + upsert en `profiles.avatar_url`; `removeAvatar` borra Storage + pone `avatar_url = null`
- `app/(app)/profile/index.tsx` — componente `AvatarHero` con foto real, overlay de cámara, action sheet Cambiar/Eliminar, estado de carga
- `supabase/migrations/20260601_006_storage_paths_multitenant.sql` — documenta convenciones + ajusta política `designs_delete_org` para restringir a admin/owner OR uploader (segundo segmento del path)

---

## Reglas del proyecto

- Siempre leer el estado de módulos antes de empezar trabajo nuevo
- Nunca usar `style` inline si NativeWind puede resolverlo
- Todos los componentes UI usan `useTheme` — sin colores hardcodeados
- No instalar dependencias nuevas sin preguntarle al usuario
- El plan vive en este `CLAUDE.md`, no en memoria externa
