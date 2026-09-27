// Datos de roles, personal y plataforma para las pruebas, con la forma del API,
// y el área de plataforma montada con su sesión (el arnés solo abre la del
// restaurante).
import { afterEach } from '@jest/globals'
import { createElement } from 'react'
import type { RouteObject } from 'react-router'

import type {
  PermissionCode,
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
import ActivityView from '../../src/features/platform/ActivityView'
import ObservabilityView from '../../src/features/platform/observability/ObservabilityView'
import NewRestaurantView from '../../src/features/platform/NewRestaurantView'
import PlatformLoginView from '../../src/features/platform/PlatformLoginView'
import PlatformShell from '../../src/features/platform/PlatformShell'
import PreviewView from '../../src/features/platform/PreviewView'
import RequirePlatformSession from '../../src/features/platform/RequirePlatformSession'
import RestaurantDetailView from '../../src/features/platform/RestaurantDetailView'
import RestaurantsView from '../../src/features/platform/RestaurantsView'
import { setPlatformAuthToken } from '../../src/services/api'
import { usePlatformSession } from '../../src/store/platformSession'
import { montarRutas, type Montaje } from '../harness'

const GRUPO_PEDIDOS = 'Pedidos'
const TOMAR: PermissionCode = 'orders.take'
const COBRAR: PermissionCode = 'orders.charge'

export const CATALOGO: PermissionInfo[] = [
  { code: TOMAR, group: GRUPO_PEDIDOS, label: 'Tomar pedidos' },
  { code: COBRAR, group: GRUPO_PEDIDOS, label: 'Cobrar pedidos' },
  { code: 'cash.manage', group: 'Caja', label: 'Abrir y cerrar la caja' },
  { code: 'insights.read', group: 'Panel', label: 'Ver el panel BI' },
]

export function rol(cambios: Partial<Role> = {}): Role {
  return {
    id: 5,
    name: 'Cocina',
    kind: 'custom',
    is_editable: true,
    is_deletable: true,
    member_count: 0,
    permissions: [TOMAR],
    ...cambios,
  }
}

export const ROL_ENCARGADO = rol({
  id: 1,
  name: 'Encargado',
  kind: 'owner',
  is_editable: false,
  is_deletable: false,
  member_count: 1,
  permissions: [TOMAR, COBRAR, 'cash.manage', 'insights.read'],
})

export const ROL_MESERO = rol({
  id: 2,
  name: 'Mesero',
  kind: 'waiter',
  is_deletable: false,
  member_count: 3,
  permissions: [TOMAR, COBRAR],
})

export interface MiembroDePrueba {
  id: number
  full_name: string
  email: string
  role_id: number
  role_label: string
  is_active: boolean
  created_at: string
}

export function miembro(cambios: Partial<MiembroDePrueba> = {}): MiembroDePrueba {
  return {
    id: 8,
    full_name: 'Luis Quispe',
    email: 'luis@resthub.dev',
    role_id: 2,
    role_label: 'Mesero',
    is_active: true,
    created_at: '2026-09-01T12:00:00Z',
    ...cambios,
  }
}

/** La cuenta de quien mira (id 7 en el arnés), un mesero activo y una cocinera inactiva. */
export const EQUIPO = [
  miembro({ id: 7, full_name: 'Ana Torres', email: 'ana@resthub.dev', role_id: 1, role_label: 'Encargado' }),
  miembro(),
  miembro({ id: 9, full_name: 'Rosa Mamani', email: 'rosa@resthub.dev', role_id: 5, role_label: 'Cocina', is_active: false }),
]

export const ADMIN: PlatformAdmin = { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' }

/** Abre la sesión del administrador del sistema sin pasar por su acceso. */
export function entrarAPlataforma(admin: PlatformAdmin = ADMIN): PlatformAdmin {
  setPlatformAuthToken('token-de-plataforma')
  usePlatformSession.setState({ token: 'token-de-plataforma', admin, expired: false })
  return admin
}

afterEach(() => {
  setPlatformAuthToken(null)
  usePlatformSession.setState({ token: null, admin: null, expired: false })
})

// Las mismas rutas que `src/router` arma para `/plataforma`, sin la carga perezosa.
const RUTAS_DE_PLATAFORMA: RouteObject[] = [
  {
    path: '/plataforma',
    element: createElement(PlatformShell),
    children: [
      { path: 'acceso', element: createElement(PlatformLoginView) },
      {
        element: createElement(RequirePlatformSession),
        children: [
          { index: true, element: createElement(RestaurantsView) },
          { path: 'restaurantes/nuevo', element: createElement(NewRestaurantView) },
          { path: 'restaurantes/:restaurantId', element: createElement(RestaurantDetailView) },
          { path: 'bitacora', element: createElement(ActivityView) },
          { path: 'vista-previa', element: createElement(PreviewView) },
          { path: 'observabilidad', element: createElement(ObservabilityView) },
        ],
      },
    ],
  },
]

export function montarPlataforma(en = '/plataforma'): Montaje {
  return montarRutas(RUTAS_DE_PLATAFORMA, en)
}

export function resumenDeRestaurante(cambios: Partial<PlatformRestaurantSummary> = {}): PlatformRestaurantSummary {
  return {
    id: 4,
    name: 'La Esquina de Lucho',
    slug: 'la-esquina-de-lucho',
    timezone: 'America/Lima',
    is_active: true,
    staff_count: 4,
    active_staff_count: 3,
    created_at: '2026-09-20T15:00:00Z',
    ...cambios,
  }
}

export function fichaDeRestaurante(cambios: Partial<PlatformRestaurantDetail> = {}): PlatformRestaurantDetail {
  return {
    ...resumenDeRestaurante(),
    owners: [{ id: 30, full_name: 'Lucho Ramos', email: 'lucho@esquina.pe', is_active: true }],
    ...cambios,
  }
}

export function registroDeBitacora(cambios: Partial<PlatformActivityEntry> = {}): PlatformActivityEntry {
  return {
    id: 1,
    admin_id: 1,
    admin_name: 'Equipo RestHub',
    created_at: '2026-09-26T14:00:00Z',
    kind: 'restaurant.created',
    kind_label: 'Alta de restaurante',
    detail: 'La Esquina de Lucho',
    ...cambios,
  }
}

/** Lo que responde cada lectura del panel de observabilidad, sin filtros. */
export const RESUMEN_OBS: ObsSummary = {
  window: '24h', requests: 1520, active_restaurants: 3, error_rate: 0.0125, errors_4xx: 12, errors_5xx: 7,
  p50_ms: 18, p95_ms: 52, p99_ms: 140, avg_db_ms: 6, dropped_events: 0, sampled: false,
}

export const SERIE_OBS = {
  bucket_seconds: 3600,
  sampled: false,
  points: [
    { t: '2026-09-26T13:00:00Z', requests: 700, errors_5xx: 3, p95_ms: 48 },
    { t: '2026-09-26T14:00:00Z', requests: 820, errors_5xx: 4, p95_ms: 56 },
  ],
}

export const RUTAS_OBS = [
  { method: 'GET', route: '/api/v1/orders', requests: 900, errors_5xx: 0, p50_ms: 12, p95_ms: 40, avg_db_ms: 4, sampled: false },
  { method: 'POST', route: '/api/v1/orders/{order_id}/pay', requests: 120, errors_5xx: 5, p50_ms: 30, p95_ms: 90, avg_db_ms: 9, sampled: true },
]

export const ESTADOS_OBS = [
  { status: 200, count: 1480 },
  { status: 404, count: 33 },
  { status: 500, count: 7 },
]

export function logObs(cambios: Partial<ObsLogEntry> = {}): ObsLogEntry {
  return {
    id: 50, at: '2026-09-26T14:10:00Z', level: 'error', event: 'payment.failed', logger: 'resthub.orders',
    has_traceback: true, request_id: 'req-abc', restaurant_id: 4, ...cambios,
  }
}

export function peticionObs(cambios: Partial<ObsRequestEntry> = {}): ObsRequestEntry {
  return {
    id: 80, at: '2026-09-26T14:10:00Z', method: 'POST', route: '/api/v1/orders/{order_id}/pay', status: 500,
    duration_ms: 95, db_ms: 12, db_queries: 3, account_kind: 'staff', account_id: 7, restaurant_id: 4,
    request_id: 'req-abc', ...cambios,
  }
}
