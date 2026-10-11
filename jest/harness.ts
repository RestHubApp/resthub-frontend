// Arnés de las pruebas de componentes: monta una pantalla como la ve el
// usuario (router, caché de consultas y sesión) y responde el API con un
// servidor falso a nivel del adaptador de Axios. Así se ejercitan también las
// funciones de `src/api/` y los interceptores de `src/services/api.ts`.
import { afterEach, beforeEach } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import { userEvent, type UserEvent } from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { createElement, type ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, useLocation, type RouteObject } from 'react-router'

import type { CurrentUserResponse, PermissionCode } from '../src/api/types'
import { SCREENS } from '../src/router/screens'
import { ToastStack } from '../src/features/shell/ToastStack'
import { api, setAuthToken } from '../src/services/api'
import { queryClient } from '../src/services/queryClient'
import { useNotifications } from '../src/store/notifications'
import { usePlatformSession } from '../src/store/platformSession'
import { useSession } from '../src/store/session'

/** Las pantallas del restaurante tal como las registra el router: de ellas salen el menú y la precarga del armazón. */
export const SCREENSValue = SCREENS

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** Una petición que llegó al servidor falso. */
export interface Request {
  readonly method: Method
  readonly url: string
  readonly params: Record<string, unknown>
  readonly body: unknown
  readonly headers: Record<string, string>
}

/** Lo que responde una ruta a partir de la petición. */
export type Respond = (request: Request) => unknown

interface Route {
  readonly method: Method
  readonly path: string | RegExp
  readonly status: number
  readonly responder: Respond
  veces: number | null
}

/** Un error del API con el cuerpo de FastAPI (`{ detail }`). */
export class ErrorResponse {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, detail: unknown = 'Error de prueba') {
    this.status = status
    this.detail = detail
  }
}

function coincide(route: Route, request: Request): boolean {
  if (route.method !== request.method) {
    return false
  }
  return typeof route.path === 'string' ? route.path === request.url : route.path.test(request.url)
}

function bodyOf(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }
  try {
    return JSON.parse(data) as unknown
  } catch {
    return data
  }
}

function headersOf(config: InternalAxiosRequestConfig): Record<string, string> {
  const flat: Record<string, string> = {}
  for (const [password, value] of Object.entries(AxiosHeaders.from(config.headers).toJSON())) {
    flat[password.toLowerCase()] = String(value)
  }
  return flat
}

function respondOf(response: unknown): Respond {
  return typeof response === 'function' ? (response as Respond) : () => response
}

function requestOf(config: InternalAxiosRequestConfig): Request {
  return {
    method: (config.method ?? 'get').toLowerCase() as Method,
    url: config.url ?? '',
    params: (config.params ?? {}) as Record<string, unknown>,
    body: bodyOf(config.data),
    headers: headersOf(config),
  }
}

/** El servidor falso: las rutas se declaran con `on` y las peticiones quedan en `peticiones`. */
export class FakeServer {
  readonly peticiones: Request[] = []
  private readonly rutas: Route[] = []

  /**
   * Declara una respuesta: un valor fijo, una función de la petición o un
   * `RespuestaDeError`. Las últimas declaradas tienen prioridad.
   */
  on(method: Method, path: string | RegExp, response: unknown, status = 200): this {
    this.agregar({ method, path, status, responder: respondOf(response), veces: null })
    return this
  }

  /** Igual que `on`, pero solo para la próxima petición que coincida. */
  once(method: Method, path: string | RegExp, response: unknown, status = 200): this {
    this.agregar({ method, path, status, responder: respondOf(response), veces: 1 })
    return this
  }

  private agregar(route: Route): void {
    this.rutas.unshift(route)
  }

  /** Las peticiones con ese método y esa ruta. */
  llamadas(method: Method, path: string | RegExp): Request[] {
    return this.peticiones.filter((p) => coincide({ method, path, status: 0, responder: () => null, veces: null }, p))
  }

  private tomarRuta(request: Request): Route | undefined {
    const route = this.rutas.find((r) => (r.veces === null || r.veces > 0) && coincide(r, request))
    if (route !== undefined && route.veces !== null) {
      route.veces -= 1
    }
    return route
  }

  readonly adapter: AxiosAdapter = async (config) => {
    const request = requestOf(config)
    this.peticiones.push(request)
    const route = this.tomarRuta(request)
    const value = route ? await route.responder(request) : new ErrorResponse(404, 'No existe (prueba)')
    const error = value instanceof ErrorResponse ? value : null
    const status = error?.status ?? route?.status ?? 404
    const data = error ? { detail: error.detail } : value
    const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config, request: {} }
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${String(status)}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    return response
  }
}

/** Una respuesta del API que no llega nunca, para ver el estado de carga. */
export function withoutResponse(): Promise<never> {
  return new Promise<never>(() => undefined)
}

/** Un corte de red: Axios falla sin respuesta. */
export function withoutNetwork(): never {
  throw new AxiosError('Network Error', AxiosError.ERR_NETWORK)
}

const adapterOriginal = api.defaults.adapter
let currentServer: FakeServer | null = null

/** Instala un servidor falso nuevo para la prueba en curso. */
export function server(): FakeServer {
  currentServer = new FakeServer()
  api.defaults.adapter = currentServer.adapter
  return currentServer
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
export function handleAccount(permissions: readonly PermissionCode[], changes: Partial<CurrentUserResponse> = {}): CurrentUserResponse {
  return {
    permissions: [...permissions],
    preview: false,
    terms_version: '2026-10',
    terms_accepted: true,
    restaurant: { id: 1, name: 'La Picantería', slug: 'la-picanteria', timezone: 'America/Lima' },
    user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 1, role_label: 'Encargado' },
    ...changes,
  }
}

/** Abre la sesión del administrador del sistema sin pasar por su acceso. */
export function signInToPlatform(): void {
  usePlatformSession.getState().signIn('token-de-plataforma', { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' })
}

/** Abre una sesión de restaurante sin pasar por el acceso. */
export function signInAs(permissions: readonly PermissionCode[] = PERMISSIONS_OWNER, changes: Partial<CurrentUserResponse> = {}): CurrentUserResponse {
  const account = handleAccount(permissions, changes)
  setAuthToken('token-de-prueba')
  useSession.setState({ token: 'token-de-prueba', account, expired: false, passwordChanged: false })
  return account
}

// Muestra la ruta actual para comprobar adónde llevó una navegación.
function WhereEstoy() {
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
  readonly rutas?: RouteObject[]
}

/** Monta una pantalla dentro de un router en memoria y con el caché de la aplicación. */
export function handleMount(screen: ReactElement, { path = '/', en = path, rutas: routes = [] }: MountOptions = {}): Mount {
  return mountRoutes([{ path, element: screen }, ...routes], en)
}

// React Router guarda lo que ya cargó de una ruta perezosa usando el objeto de
// la ruta como clave. Cada router de prueba recibe copias nuevas, o la segunda
// prueba que abre la misma pantalla la encuentra «cargada» y sin componente.
function copy(routes: readonly RouteObject[]): RouteObject[] {
  return routes.map((route) => {
    const copyValue: RouteObject = { ...route }
    if (typeof route.lazy === 'object') {
      copyValue.lazy = { ...route.lazy }
    }
    if (route.children) {
      copyValue.children = copy(route.children)
    }
    return copyValue
  })
}

/** Monta un router en memoria con estas rutas (p. ej. las de `src/router`). */
export function mountRoutes(routes: RouteObject[], en = '/'): Mount {
  const router = createMemoryRouter([...copy(routes), { path: '*', element: createElement(WhereEstoy) }], {
    initialEntries: [en],
  })
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
  api.defaults.adapter = adapterOriginal
  currentServer = null
  setAuthToken(null)
  useSession.setState({ token: null, account: null, expired: false, passwordChanged: false })
  if (usePlatformSession.getState().token !== null) {
    usePlatformSession.getState().signOut()
  }
  useNotifications.setState({ toasts: [] })
})

/** El primer elemento de una lista que la prueba da por no vacia; falla con un mensaje claro si no. */
export function handleFirst<T>(list: readonly T[]): T {
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
