// Arnés de las pruebas de componentes: monta una pantalla como la ve el
// usuario (router, caché de consultas y sesión) y responde el API con un
// servidor falso montado sobre MSW (`jest/mswServer.ts`). Así se ejercitan también
// las funciones de `src/api/`, el cliente tipado y el transporte de
// `src/services/api.ts`.
import { afterEach, beforeEach } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import { userEvent, type UserEvent } from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createElement, type ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, useLocation, type RouteObject } from 'react-router'

import { mswServer } from './mswServer'
import type { ErrorCode, PermissionCode, StaffSession } from '../src/api/types'
import { RouteError } from '../src/router/RouteError'
import { SCREENS } from '../src/router/screens'
import { ToastStack } from '../src/features/shell/ToastStack'
import { setAuthToken } from '../src/services/apiCredentials'
import { queryClient } from '../src/services/queryClient'
import { useNotifications } from '../src/store/notifications'
import { staffOf, useSession } from '../src/store/session'

/** Las pantallas del restaurante tal como las registra el router: de ellas salen el menú y la precarga del armazón. */
export const TEST_SCREENS = SCREENS

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** Una petición que llegó al servidor falso. */
export interface Request {
  readonly method: Method
  readonly url: string
  /** La consulta de la URL: lo que viaja es texto, y una clave repetida (`kind=a&kind=b`) es una lista. */
  readonly params: Record<string, string | string[]>
  readonly body: unknown
  readonly headers: Record<string, string>
}

/** Lo que responde una ruta a partir de la petición. */
export type Respond = (request: Request) => unknown

interface Route {
  readonly method: Method
  readonly path: string | RegExp
  readonly status: number
  readonly respond: Respond
  times: number | null
}

// El código genérico que el servidor pone a un error sin código propio, según su estado.
const CODE_BY_STATUS: Readonly<Partial<Record<number, ErrorCode>>> = {
  400: 'bad_request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  422: 'unprocessable',
  429: 'rate_limited',
  503: 'database_unavailable',
}

/**
 * Un error del API con el cuerpo del servidor (`{ detail, code }`). Sin `code`
 * lleva el genérico de su estado, como el servidor con un error sin código propio.
 */
export class ErrorResponse {
  readonly status: number
  readonly detail: unknown
  readonly code: ErrorCode

  constructor(status: number, detail: unknown = 'Error de prueba', code?: ErrorCode) {
    this.status = status
    this.detail = detail
    this.code = code ?? CODE_BY_STATUS[status] ?? 'http_error'
  }
}

function coincide(route: Route, request: Request): boolean {
  if (route.method !== request.method) {
    return false
  }
  return typeof route.path === 'string' ? route.path === request.url : route.path.test(request.url)
}

function bodyOf(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text === '' ? undefined : text
  }
}

function respondOf(response: unknown): Respond {
  return typeof response === 'function' ? (response as Respond) : () => response
}

type HttpRequest = InstanceType<typeof globalThis.Request>

// El prefijo del API no es parte de la ruta que las pruebas declaran.
const API_PREFIX = /^\/api\/v1/u

function paramsOf(url: URL): Record<string, string | string[]> {
  const grouped = new Map<string, string[]>()
  for (const [key, value] of url.searchParams) {
    grouped.set(key, [...(grouped.get(key) ?? []), value])
  }
  return Object.fromEntries([...grouped].map(([key, values]) => [key, values.length === 1 ? values.join('') : values]))
}

async function requestOf(request: HttpRequest): Promise<Request> {
  const url = new URL(request.url)
  return {
    method: request.method.toLowerCase() as Method,
    url: url.pathname.replace(API_PREFIX, ''),
    params: paramsOf(url),
    body: bodyOf(await request.text()),
    headers: Object.fromEntries(request.headers),
  }
}

// Lo que lanza `withoutNetwork` para que el manejador responda con un corte de red.
class NetworkCut extends TypeError {}

/** El servidor falso: las rutas se declaran con `on` y las peticiones quedan en `peticiones`. */
export class FakeServer {
  readonly requests: Request[] = []
  private readonly routes: Route[] = []

  /**
   * Declara una respuesta: un valor fijo, una función de la petición o un
   * `RespuestaDeError`. Las últimas declaradas tienen prioridad.
   */
  on(method: Method, path: string | RegExp, response: unknown, status = 200): this {
    this.add({ method, path, status, respond: respondOf(response), times: null })
    return this
  }

  /** Igual que `on`, pero solo para la próxima petición que coincida. */
  once(method: Method, path: string | RegExp, response: unknown, status = 200): this {
    this.add({ method, path, status, respond: respondOf(response), times: 1 })
    return this
  }

  private add(route: Route): void {
    this.routes.unshift(route)
  }

  /** Las peticiones con ese método y esa ruta. */
  calls(method: Method, path: string | RegExp): Request[] {
    return this.requests.filter((p) => coincide({ method, path, status: 0, respond: () => null, times: null }, p))
  }

  private takeRoute(request: Request): Route | undefined {
    const route = this.routes.find((r) => (r.times === null || r.times > 0) && coincide(r, request))
    if (route !== undefined && route.times !== null) {
      route.times -= 1
    }
    return route
  }

  /** El manejador de MSW que atiende cualquier ruta de `/api/v1` con las rutas declaradas. */
  readonly handler = http.all('*/api/v1/*', async ({ request }) => {
    const entry = await requestOf(request)
    this.requests.push(entry)
    const route = this.takeRoute(entry)
    try {
      const value = route ? await route.respond(entry) : new ErrorResponse(404, 'No existe (prueba)')
      return responseOf(value, route?.status ?? 404)
    } catch (error) {
      if (error instanceof NetworkCut) return HttpResponse.error()
      throw error
    }
  })
}

/** La respuesta HTTP de lo que declaró la prueba: un error del API, un valor JSON o nada. */
function responseOf(value: unknown, routeStatus: number): Response {
  const status = value instanceof ErrorResponse ? value.status : routeStatus
  const data = value instanceof ErrorResponse ? { detail: value.detail, code: value.code } : value
  if (status === 204 || data === undefined) {
    return new Response(null, { status: status === 200 ? 204 : status })
  }
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Una respuesta del API que no llega nunca, para ver el estado de carga. */
export function withoutResponse(): Promise<never> {
  return new Promise<never>(() => undefined)
}

/** Un corte de red: `fetch` falla sin respuesta. */
export function withoutNetwork(): never {
  throw new NetworkCut('Failed to fetch')
}

/** Instala un servidor falso nuevo para la prueba en curso. */
export function server(): FakeServer {
  const fake = new FakeServer()
  mswServer.use(fake.handler)
  return fake
}

/** Todos los permisos: la cuenta del encargado. */
export const PERMISSIONS_OWNER: readonly PermissionCode[] = [
  'menu.read', 'menu.manage', 'tables.read', 'tables.manage', 'orders.take', 'orders.read_all',
  'orders.manage', 'orders.charge', 'orders.discount_any', 'cash.manage', 'billing.issue',
  'billing.manage', 'customers.read', 'customers.manage', 'customers.erase', 'reservations.read', 'reservations.manage',
  'inventory.read', 'inventory.manage', 'staff.manage', 'restaurant.manage', 'insights.read',
  'activity.read', 'roles.manage',
]

/** Lo del mesero: toma pedidos, cobra los suyos y consulta. */
export const PERMISSIONS_WAITER: readonly PermissionCode[] = [
  'menu.read', 'tables.read', 'orders.take', 'orders.charge', 'customers.read', 'reservations.read',
]

/** Una cuenta de restaurante con los permisos dados. */
export function buildAccount(permissions: readonly PermissionCode[], changes: Partial<StaffSession> = {}): StaffSession {
  return {
    kind: 'staff',
    permissions: [...permissions],
    preview: false,
    terms_version: '2026-10',
    terms_accepted: true,
    privacy_version: '2026-10',
    privacy_accepted: true,
    restaurant: { id: 1, name: 'La Picantería', slug: 'la-picanteria', timezone: 'America/Lima' },
    user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 1, role_label: 'Encargado' },
    ...changes,
  }
}

/** Abre una sesión de restaurante sin pasar por el acceso. */
export function signInAs(permissions: readonly PermissionCode[] = PERMISSIONS_OWNER, changes: Partial<StaffSession> = {}): StaffSession {
  const account = buildAccount(permissions, changes)
  setAuthToken('token-de-prueba')
  useSession.setState({ token: 'token-de-prueba', account, expired: false, passwordChanged: false })
  return account
}

/** La sesión del personal abierta ahora, o `null` (sin sesión o de plataforma). */
export function currentStaff(): StaffSession | null {
  return staffOf(useSession.getState().account)
}

// Muestra la ruta actual para comprobar adónde llevó una navegación.
function WhereAmI() {
  const { pathname, search } = useLocation()
  return createElement('output', { 'aria-label': 'Ruta actual' }, `${pathname}${search}`)
}

export interface Mount extends RenderResult {
  readonly user: UserEvent
  readonly router: ReturnType<typeof createMemoryRouter>
}

interface MountOptions {
  /** La ruta con parámetros, como en el router (`/pedidos/:orderId`). */
  readonly path?: string
  /** La dirección en la que se abre (`/pedidos/12`). */
  readonly en?: string
  /** Otras rutas del router, además de la pantalla. */
  readonly routes?: RouteObject[]
}

/** Monta una pantalla dentro de un router en memoria y con el caché de la aplicación. */
export function mountScreen(screen: ReactElement, { path = '/', en = path, routes = [] }: MountOptions = {}): Mount {
  return mountRoutes([{ path, element: screen }, ...routes], en)
}

// React Router guarda lo que ya cargó de una ruta perezosa usando el objeto de
// la ruta como clave. Cada router de prueba recibe copias nuevas, o la segunda
// prueba que abre la misma pantalla la encuentra «cargada» y sin componente.
function copy(routes: readonly RouteObject[]): RouteObject[] {
  return routes.map((route) => {
    const routeCopy: RouteObject = { ...route }
    if (typeof route.lazy === 'object') {
      routeCopy.lazy = { ...route.lazy }
    }
    if (route.children) {
      routeCopy.children = copy(route.children)
    }
    return routeCopy
  })
}

/** Monta un router en memoria con estas rutas (p. ej. las de `src/router`). */
export function mountRoutes(routes: RouteObject[], en = '/'): Mount {
  const router = createMemoryRouter(
    [...copy(routes).map((route) => ({ ErrorBoundary: RouteError, ...route })), { path: '*', element: createElement(WhereAmI), ErrorBoundary: RouteError }],
    {
      initialEntries: [en],
    },
  )
  const user = userEvent.setup()
  // Los avisos (`useNotifications`) se ven como en el armazón de la aplicación.
  const result = render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
      createElement(ToastStack),
    ),
  )
  return { ...result, user, router }
}

beforeEach(() => {
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } })
})

afterEach(() => {
  queryClient.clear()
  setAuthToken(null)
  useSession.setState({ token: null, account: null, expired: false, passwordChanged: false })
  useNotifications.setState({ toasts: [] })
})

/** El primer elemento de una lista que la prueba da por no vacia; falla con un mensaje claro si no. */
export function firstOf<T>(list: readonly T[]): T {
  const element = list[0]
  if (element === undefined) {
    throw new Error('Se esperaba al menos un elemento.')
  }
  return element
}

/** El segundo elemento de una lista que la prueba da por tener al menos dos. */
export function second<T>(list: readonly T[]): T {
  const element = list[1]
  if (element === undefined) {
    throw new Error('Se esperaban al menos dos elementos.')
  }
  return element
}
