import type { BrowserContext } from '@playwright/test'

import type { Route } from './routes.ts'

// La sesión de un mesero sin pasar por el acceso ni por un backend: se guarda
// donde la aplicación la guarda y las llamadas al API se responden aquí. Los
// bytes del API no se cuentan (los datos reales dependen del local).
const SESSION_KEY = 'resthub.session.v2'
const A_YEAR_S = 365 * 24 * 60 * 60

const WAITER_PERMISSIONS = ['menu.read', 'tables.read', 'orders.take', 'orders.charge', 'customers.read', 'reservations.read']

const WAITER_ACCOUNT = {
  kind: 'staff',
  permissions: WAITER_PERMISSIONS,
  preview: false,
  terms_version: '2026-10',
  terms_accepted: true,
  privacy_version: '2026-10',
  privacy_accepted: true,
  restaurant: { id: 1, name: 'La Picantería', slug: 'la-picanteria', timezone: 'America/Lima' },
  user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 2, role_label: 'Mesero' },
}

// La aplicación solo lee la fecha de vencimiento del token; la firma es del servidor.
function waiterToken(): string {
  const exp = Math.floor(Date.now() / 1000) + A_YEAR_S
  return `cabecera.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.firma`
}

const EMPTY_PAGE = { items: [], total: 0, limit: 100, offset: 0 }

function bodyFor(path: string): unknown {
  switch (path) {
    case '/auth/me': {
      return WAITER_ACCOUNT
    }
    case '/auth/refresh': {
      return { ...WAITER_ACCOUNT, access_token: waiterToken(), token_type: 'bearer', expires_in: A_YEAR_S }
    }
    case '/orders': {
      return EMPTY_PAGE
    }
    default: {
      return []
    }
  }
}

/** Abre la sesión del mesero en el contexto y responde al API con datos vacíos. */
export async function signInWaiter(context: BrowserContext): Promise<void> {
  const saved = JSON.stringify({ token: waiterToken(), account: WAITER_ACCOUNT })
  await context.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [SESSION_KEY, saved] as const,
  )
  await context.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    if (path === '/events') {
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: ready\ndata: {}\n\n' })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(bodyFor(path)) })
  })
}

export function needsSession(route: Route): boolean {
  return route.session === 'waiter'
}
