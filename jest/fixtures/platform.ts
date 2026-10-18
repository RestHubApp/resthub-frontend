// Datos de roles, personal y plataforma para las pruebas, con la forma del API,
// y el área de plataforma montada con su sesión (el arnés solo abre la del
// restaurante).
import { type ComponentType, createElement } from 'react'
import type { RouteObject } from 'react-router'

import type {
  PermissionCode,
  PlatformPermissionCode,
  PlatformSession,
  PermissionInfo,
  PlatformActivityEntry,
  ObsLogEntry,
  ObsRequestEntry,
  ObsSummary,
  PlatformAdmin,
  PlatformRestaurantDetail,
  PlatformRestaurantSummary,
  Role,
} from '../../src/api/types'
import { LoginView } from '../../src/features/auth/LoginView'
import { AppShell } from '../../src/features/shell/AppShell'
import { HomeRedirect } from '../../src/features/shell/HomeRedirect'
import { RequireSession } from '../../src/features/shell/RequireSession'
import { PLATFORM_SCREENS } from '../../src/router/screens/platformScreens'
import { SCREENS } from '../../src/router/screens'
import { setAuthToken } from '../../src/services/apiCredentials'
import { useSession } from '../../src/store/session'
import { ActivityView } from '../../src/features/platform/ActivityView'
import { ObservabilityView } from '../../src/features/platform/observability/ObservabilityView'
import { NewRestaurantView } from '../../src/features/platform/NewRestaurantView'
import { PreviewView } from '../../src/features/platform/PreviewView'
import { RestaurantDetailView } from '../../src/features/platform/RestaurantDetailView'
import { RestaurantsView } from '../../src/features/platform/RestaurantsView'
import { mountRoutes, type Mount } from '../harness'

const GROUP_ORDERS = 'Pedidos'
const TAKE: PermissionCode = 'orders.take'
const CHARGE: PermissionCode = 'orders.charge'

export const CATALOG: PermissionInfo[] = [
  { code: TAKE, group: GROUP_ORDERS, label: 'Tomar pedidos' },
  { code: CHARGE, group: GROUP_ORDERS, label: 'Cobrar pedidos' },
  { code: 'cash.manage', group: 'Caja', label: 'Abrir y cerrar la caja' },
  { code: 'insights.read', group: 'Panel', label: 'Ver el panel BI' },
]

export function role(changes: Partial<Role> = {}): Role {
  return {
    id: 5,
    name: 'Cocina',
    kind: 'custom',
    is_editable: true,
    is_deletable: true,
    member_count: 0,
    permissions: [TAKE],
    ...changes,
  }
}

export const ROLE_OWNER = role({
  id: 1,
  name: 'Encargado',
  kind: 'owner',
  is_editable: false,
  is_deletable: false,
  member_count: 1,
  permissions: [TAKE, CHARGE, 'cash.manage', 'insights.read'],
})

export const ROLE_WAITER = role({
  id: 2,
  name: 'Mesero',
  kind: 'waiter',
  is_deletable: false,
  member_count: 3,
  permissions: [TAKE, CHARGE],
})

export interface TestMember {
  id: number
  full_name: string
  email: string
  role_id: number
  role_label: string
  is_active: boolean
  created_at: string
}

export function member(changes: Partial<TestMember> = {}): TestMember {
  return {
    id: 8,
    full_name: 'Luis Quispe',
    email: 'luis@resthub.dev',
    role_id: 2,
    role_label: 'Mesero',
    is_active: true,
    created_at: '2026-09-01T12:00:00Z',
    ...changes,
  }
}

/** La cuenta de quien mira (id 7 en el arnés), un mesero activo y una cocinera inactiva. */
export const TEAM = [
  member({ id: 7, full_name: 'Ana Torres', email: 'ana@resthub.dev', role_id: 1, role_label: 'Encargado' }),
  member(),
  member({ id: 9, full_name: 'Rosa Mamani', email: 'rosa@resthub.dev', role_id: 5, role_label: 'Cocina', is_active: false }),
]

export const ADMIN: PlatformAdmin = { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' }

/** Todos los permisos de la administración del sistema: lo que tiene hoy toda cuenta de plataforma. */
export const PERMISSIONS_PLATFORM: readonly PlatformPermissionCode[] = [
  'platform.restaurants.read',
  'platform.restaurants.manage',
  'platform.activity.read',
  'platform.preview.open',
  'platform.observability.read',
]

/** Abre la sesión de la administración del sistema sin pasar por el acceso. */
export function signInToPlatform(
  permissions: readonly PlatformPermissionCode[] = PERMISSIONS_PLATFORM,
  admin: PlatformAdmin = ADMIN,
): PlatformSession {
  const account: PlatformSession = { kind: 'platform', admin, permissions: [...permissions], preview: false }
  setAuthToken('token-de-plataforma')
  useSession.setState({ token: 'token-de-plataforma', account, expired: false, passwordChanged: false })
  return account
}

// Las pantallas de plataforma del registro, ya cargadas: la prueba no espera a la carga perezosa.
const PLATFORM_COMPONENTS: ReadonlyMap<string, ComponentType> = new Map([
  ['/plataforma', RestaurantsView],
  ['/plataforma/restaurantes/nuevo', NewRestaurantView],
  ['/plataforma/restaurantes/:restaurantId', RestaurantDetailView],
  ['/plataforma/bitacora', ActivityView],
  ['/plataforma/vista-previa', PreviewView],
  ['/plataforma/observabilidad', ObservabilityView],
])

// Las mismas rutas que `src/router` arma para `/plataforma` (el mismo armazón y
// la misma guarda por permiso), sin la carga perezosa.
const PLATFORM_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: createElement(AppShell, { screens: SCREENS }),
    children: [
      { index: true, Component: HomeRedirect },
      { path: 'acceso', element: createElement(LoginView) },
      ...PLATFORM_SCREENS.map(({ path, permission }) => {
        const Component = PLATFORM_COMPONENTS.get(path)
        if (Component === undefined) {
          throw new Error(`Falta la pantalla de ${path} en las pruebas.`)
        }
        return { element: createElement(RequireSession, { permission }), children: [{ path, element: createElement(Component) }] }
      }),
    ],
  },
]

export function mountPlatform(en = '/plataforma'): Mount {
  return mountRoutes(PLATFORM_ROUTES, en)
}

export function restaurantSummary(changes: Partial<PlatformRestaurantSummary> = {}): PlatformRestaurantSummary {
  return {
    id: 4,
    name: 'La Esquina de Lucho',
    slug: 'la-esquina-de-lucho',
    timezone: 'America/Lima',
    is_active: true,
    staff_count: 4,
    active_staff_count: 3,
    created_at: '2026-09-20T15:00:00Z',
    ...changes,
  }
}

export function restaurantCard(changes: Partial<PlatformRestaurantDetail> = {}): PlatformRestaurantDetail {
  return {
    ...restaurantSummary(),
    owners: [{ id: 30, full_name: 'Lucho Ramos', email: 'lucho@esquina.pe', is_active: true, must_change_password: false }],
    ...changes,
  }
}

export function logRecord(changes: Partial<PlatformActivityEntry> = {}): PlatformActivityEntry {
  return {
    id: 1,
    admin_id: 1,
    admin_name: 'Equipo RestHub',
    created_at: '2026-09-26T14:00:00Z',
    kind: 'restaurant.created',
    kind_label: 'Alta de restaurante',
    detail: 'La Esquina de Lucho',
    ...changes,
  }
}

/** Lo que responde cada lectura del panel de observabilidad, sin filtros. */
export const SUMMARY_OBS: ObsSummary = {
  window: '24h', requests: 1520, active_restaurants: 3, error_rate: 0.0125, errors_4xx: 12, errors_5xx: 7,
  p50_ms: 18, p95_ms: 52, p99_ms: 140, avg_db_ms: 6, dropped_events: 0, sampled: false,
}

export const SERIES_OBS = {
  bucket_seconds: 3600,
  sampled: false,
  points: [
    { t: '2026-09-26T13:00:00Z', requests: 700, errors_5xx: 3, p95_ms: 48 },
    { t: '2026-09-26T14:00:00Z', requests: 820, errors_5xx: 4, p95_ms: 56 },
  ],
}

export const ROUTES_OBS = [
  { method: 'GET', route: '/api/v1/orders', requests: 900, errors_5xx: 0, p50_ms: 12, p95_ms: 40, avg_db_ms: 4, sampled: false },
  { method: 'POST', route: '/api/v1/orders/{order_id}/pay', requests: 120, errors_5xx: 5, p50_ms: 30, p95_ms: 90, avg_db_ms: 9, sampled: true },
]

export const STATUSES_OBS = [
  { status: 200, count: 1480 },
  { status: 404, count: 33 },
  { status: 500, count: 7 },
]

export function logObs(changes: Partial<ObsLogEntry> = {}): ObsLogEntry {
  return {
    id: 50, at: '2026-09-26T14:10:00Z', level: 'error', event: 'payment.failed', logger: 'resthub.orders',
    has_traceback: true, request_id: 'req-abc', restaurant_id: 4, ...changes,
  }
}

export function requestObs(changes: Partial<ObsRequestEntry> = {}): ObsRequestEntry {
  return {
    id: 80, at: '2026-09-26T14:10:00Z', method: 'POST', route: '/api/v1/orders/{order_id}/pay', status: 500,
    duration_ms: 95, db_ms: 12, db_queries: 3, account_kind: 'staff', account_id: 7, restaurant_id: 4,
    request_id: 'req-abc', ...changes,
  }
}
