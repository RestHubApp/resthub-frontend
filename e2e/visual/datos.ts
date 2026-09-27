// Datos fijos para las pantallas del área de plataforma que muestran lo que
// hacen todas las pruebas a la vez (la lista de restaurantes, la bitácora, el
// local de muestra y la observabilidad). Con los datos reales cada captura
// saldría distinta; con estos, la pantalla se dibuja siempre igual y la
// regresión visual compara solo la interfaz.

const ALTA = '2026-09-01T15:30:00Z'
const HORA = 3_600_000
const CUARTO = 900
const PUNTOS = 97
const FIN = Date.parse('2026-09-26T20:00:00Z')

export const RESTAURANTES = {
  items: [
    {
      id: 3,
      name: 'La Esquina de Lucho',
      slug: 'la-esquina-de-lucho',
      timezone: 'America/Lima',
      is_active: false,
      created_at: '2026-09-20T17:05:00Z',
      staff_count: 2,
      active_staff_count: 0,
    },
    {
      id: 2,
      name: 'Restaurante E2E',
      slug: 'e2e-local',
      timezone: 'America/Lima',
      is_active: true,
      created_at: '2026-09-10T14:00:00Z',
      staff_count: 3,
      active_staff_count: 3,
    },
    {
      id: 1,
      name: 'Restaurante Demo',
      slug: 'restaurante-demo',
      timezone: 'America/Lima',
      is_active: true,
      created_at: ALTA,
      staff_count: 3,
      active_staff_count: 3,
    },
  ],
  total: 3,
}

const ADMIN = { admin_id: 1, admin_name: 'Administración RestHub' }

export const BITACORA = {
  items: [
    { id: 4, ...ADMIN, kind: 'signed_in', kind_label: 'Inició sesión', detail: '', created_at: '2026-09-26T15:10:00Z' },
    {
      id: 3,
      ...ADMIN,
      kind: 'restaurant_deactivated',
      kind_label: 'Desactivó un restaurante',
      detail: 'La Esquina de Lucho (la-esquina-de-lucho)',
      created_at: '2026-09-25T22:40:00Z',
    },
    {
      id: 2,
      ...ADMIN,
      kind: 'restaurant_created',
      kind_label: 'Dio de alta un restaurante',
      detail: 'La Esquina de Lucho (la-esquina-de-lucho), encargado lucho@e2e.resthub.dev',
      created_at: '2026-09-20T17:05:00Z',
    },
    { id: 1, ...ADMIN, kind: 'signed_in', kind_label: 'Inició sesión', detail: '', created_at: '2026-09-20T17:00:00Z' },
  ],
  total: 4,
}

export const LOCAL_DE_MUESTRA = {
  restaurant: {
    id: 9,
    name: 'Restaurante de muestra',
    slug: 'muestra-local',
    timezone: 'America/Lima',
    is_active: true,
    created_at: ALTA,
    staff_count: 3,
    active_staff_count: 3,
  },
  accounts: [
    { kind: 'owner', role_label: 'Encargado', full_name: 'Encargado de muestra' },
    { kind: 'waiter', role_label: 'Mesero', full_name: 'Mesero de muestra' },
    { kind: 'custom', role_label: 'Cocinero', full_name: 'Cocinero de muestra' },
  ],
}

/** El tráfico de un día típico: sube al mediodía y en la cena (horas de Lima). */
function serie() {
  return Array.from({ length: PUNTOS }, (_, indice) => {
    const instante = FIN - (PUNTOS - 1 - indice) * (CUARTO * 1000)
    const horaLima = (new Date(instante).getUTCHours() + 19) % 24
    const pico = horaLima >= 12 && horaLima <= 15 ? 60 : 0
    const cena = horaLima >= 19 && horaLima <= 22 ? 45 : 0
    const requests = horaLima >= 9 ? 12 + pico + cena : 0
    return {
      t: new Date(instante).toISOString().replace('.000Z', 'Z'),
      requests,
      errors_5xx: indice === 60 ? 2 : 0,
      p95_ms: requests === 0 ? 0 : 80 + pico,
    }
  })
}

const RUTAS = [
  ['GET', '/api/v1/orders', 820, 0, 18.4, 64.2, 6.1],
  ['POST', '/api/v1/orders', 310, 2, 41.0, 120.5, 14.2],
  ['GET', '/api/v1/tables', 290, 0, 12.3, 40.8, 4.4],
  ['POST', '/api/v1/orders/{order_id}/charge', 150, 0, 55.2, 140.1, 21.7],
  ['GET', '/api/v1/menu', 140, 0, 9.8, 30.0, 3.2],
] as const

const PETICIONES = [
  ['GET', '/api/v1/orders', 200, 21.4, 'staff'],
  ['POST', '/api/v1/orders', 201, 38.9, 'staff'],
  ['POST', '/api/v1/orders/{order_id}/charge', 200, 61.0, 'staff'],
  ['POST', '/api/v1/orders', 500, 12.5, 'staff'],
  ['POST', '/api/v1/auth/login', 401, 310.2, 'anonymous'],
] as const

export const OBSERVABILIDAD = {
  summary: {
    window: '24h',
    requests: 1710,
    errors_5xx: 2,
    errors_4xx: 7,
    error_rate: 0.0012,
    p50_ms: 22.5,
    p95_ms: 131.0,
    p99_ms: 280.4,
    avg_db_ms: 8.3,
    active_restaurants: 2,
    dropped_events: 0,
    sampled: false,
  },
  timeseries: { bucket_seconds: CUARTO, sampled: false, points: serie() },
  routes: RUTAS.map(([method, route, requests, errores, p50, p95, db]) => ({
    method,
    route,
    requests,
    errors_5xx: errores,
    p50_ms: p50,
    p95_ms: p95,
    avg_db_ms: db,
    sampled: false,
  })),
  status: [
    { status: 200, count: 1250 },
    { status: 201, count: 451 },
    { status: 401, count: 5 },
    { status: 404, count: 2 },
    { status: 500, count: 2 },
  ],
  logs: {
    items: [
      {
        id: 2,
        at: '2026-09-26T19:05:00Z',
        level: 'error',
        logger: 'resthub.orders',
        event: 'orders.open_failed',
        request_id: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        restaurant_id: 2,
        has_traceback: true,
      },
      {
        id: 1,
        at: '2026-09-26T18:40:00Z',
        level: 'warning',
        logger: 'resthub.auth',
        event: 'auth.login_failed',
        request_id: 'f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5',
        restaurant_id: null,
        has_traceback: false,
      },
    ],
    next_before_id: null,
  },
  requests: {
    items: PETICIONES.map(([method, route, status, duracion, cuenta], indice) => ({
      id: 100 - indice,
      at: new Date(FIN - indice * HORA).toISOString(),
      method,
      route,
      status,
      duration_ms: duracion,
      db_ms: 3.5,
      db_queries: 4,
      request_id: `0000000000000000000000000000000${String(indice)}`,
      account_kind: cuenta,
      restaurant_id: cuenta === 'staff' ? 2 : null,
      account_id: cuenta === 'staff' ? 7 : null,
    })),
    next_before_id: null,
  },
} as const
