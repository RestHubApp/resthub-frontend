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
import ToastStack from '../src/features/shell/ToastStack'
import { api, setAuthToken } from '../src/services/api'
import { queryClient } from '../src/services/queryClient'
import { useNotifications } from '../src/store/notifications'
import { usePlatformSession } from '../src/store/platformSession'
import { useSession } from '../src/store/session'

export type Metodo = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** Una petición que llegó al servidor falso. */
export interface Peticion {
  readonly method: Metodo
  readonly url: string
  readonly params: Record<string, unknown>
  readonly body: unknown
  readonly headers: Record<string, string>
}

/** Lo que responde una ruta a partir de la petición. */
export type Responder = (peticion: Peticion) => unknown

interface Ruta {
  readonly method: Metodo
  readonly path: string | RegExp
  readonly status: number
  readonly responder: Responder
  veces: number | null
}

/** Un error del API con el cuerpo de FastAPI (`{ detail }`). */
export class RespuestaDeError {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, detail: unknown = 'Error de prueba') {
    this.status = status
    this.detail = detail
  }
}

function coincide(ruta: Ruta, peticion: Peticion): boolean {
  if (ruta.method !== peticion.method) {
    return false
  }
  return typeof ruta.path === 'string' ? ruta.path === peticion.url : ruta.path.test(peticion.url)
}

function cuerpoDe(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }
  try {
    return JSON.parse(data) as unknown
  } catch {
    return data
  }
}

function cabecerasDe(config: InternalAxiosRequestConfig): Record<string, string> {
  const planas: Record<string, string> = {}
  for (const [clave, valor] of Object.entries(AxiosHeaders.from(config.headers).toJSON())) {
    planas[clave.toLowerCase()] = String(valor)
  }
  return planas
}

function responderDe(respuesta: unknown): Responder {
  return typeof respuesta === 'function' ? (respuesta as Responder) : () => respuesta
}

function peticionDe(config: InternalAxiosRequestConfig): Peticion {
  return {
    method: (config.method ?? 'get').toLowerCase() as Metodo,
    url: config.url ?? '',
    params: (config.params ?? {}) as Record<string, unknown>,
    body: cuerpoDe(config.data),
    headers: cabecerasDe(config),
  }
}

/** El servidor falso: las rutas se declaran con `on` y las peticiones quedan en `peticiones`. */
export class ServidorFalso {
  readonly peticiones: Peticion[] = []
  private readonly rutas: Ruta[] = []

  /**
   * Declara una respuesta: un valor fijo, una función de la petición o un
   * `RespuestaDeError`. Las últimas declaradas tienen prioridad.
   */
  on(method: Metodo, path: string | RegExp, respuesta: unknown, status = 200): this {
    this.agregar({ method, path, status, responder: responderDe(respuesta), veces: null })
    return this
  }

  /** Igual que `on`, pero solo para la próxima petición que coincida. */
  once(method: Metodo, path: string | RegExp, respuesta: unknown, status = 200): this {
    this.agregar({ method, path, status, responder: responderDe(respuesta), veces: 1 })
    return this
  }

  private agregar(ruta: Ruta): void {
    this.rutas.unshift(ruta)
  }

  /** Las peticiones con ese método y esa ruta. */
  llamadas(method: Metodo, path: string | RegExp): Peticion[] {
    return this.peticiones.filter((p) => coincide({ method, path, status: 0, responder: () => null, veces: null }, p))
  }

  private tomarRuta(peticion: Peticion): Ruta | undefined {
    const ruta = this.rutas.find((r) => (r.veces === null || r.veces > 0) && coincide(r, peticion))
    if (ruta !== undefined && ruta.veces !== null) {
      ruta.veces -= 1
    }
    return ruta
  }

  readonly adapter: AxiosAdapter = async (config) => {
    const peticion = peticionDe(config)
    this.peticiones.push(peticion)
    const ruta = this.tomarRuta(peticion)
    const valor = ruta ? await ruta.responder(peticion) : new RespuestaDeError(404, 'No existe (prueba)')
    const error = valor instanceof RespuestaDeError ? valor : null
    const status = error?.status ?? ruta?.status ?? 404
    const data = error ? { detail: error.detail } : valor
    const respuesta: AxiosResponse = { data, status, statusText: String(status), headers: {}, config, request: {} }
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${String(status)}`, AxiosError.ERR_BAD_REQUEST, config, {}, respuesta)
    }
    return respuesta
  }
}

/** Una respuesta del API que no llega nunca, para ver el estado de carga. */
export function sinRespuesta(): Promise<never> {
  return new Promise<never>(() => undefined)
}

/** Un corte de red: Axios falla sin respuesta. */
export function sinRed(): never {
  throw new AxiosError('Network Error', AxiosError.ERR_NETWORK)
}

const adaptadorOriginal = api.defaults.adapter
let servidorActual: ServidorFalso | null = null

/** Instala un servidor falso nuevo para la prueba en curso. */
export function servidor(): ServidorFalso {
  servidorActual = new ServidorFalso()
  api.defaults.adapter = servidorActual.adapter
  return servidorActual
}

/** Todos los permisos: la cuenta del encargado. */
export const PERMISOS_ENCARGADO: readonly PermissionCode[] = [
  'menu.read', 'menu.manage', 'tables.read', 'tables.manage', 'orders.take', 'orders.read_all',
  'orders.manage', 'orders.charge', 'orders.discount_any', 'cash.manage', 'billing.issue',
  'billing.manage', 'customers.read', 'customers.manage', 'customers.erase', 'reservations.read', 'reservations.manage',
  'inventory.read', 'inventory.manage', 'staff.manage', 'restaurant.manage', 'insights.read',
  'activity.read', 'roles.manage',
]

/** Lo del mesero: toma pedidos, cobra los suyos y consulta. */
export const PERMISOS_MESERO: readonly PermissionCode[] = [
  'menu.read', 'tables.read', 'orders.take', 'orders.charge', 'customers.read', 'reservations.read',
]

/** Una cuenta de restaurante con los permisos dados. */
export function cuenta(permisos: readonly PermissionCode[], cambios: Partial<CurrentUserResponse> = {}): CurrentUserResponse {
  return {
    permissions: [...permisos],
    preview: false,
    terms_version: '2026-10',
    terms_accepted: true,
    restaurant: { id: 1, name: 'La Picantería', slug: 'la-picanteria', timezone: 'America/Lima' },
    user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 1, role_label: 'Encargado' },
    ...cambios,
  }
}

/** Abre la sesión del administrador del sistema sin pasar por su acceso. */
export function entrarAPlataforma(): void {
  usePlatformSession.getState().signIn('token-de-plataforma', { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' })
}

/** Abre una sesión de restaurante sin pasar por el acceso. */
export function entrarComo(permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO, cambios: Partial<CurrentUserResponse> = {}): CurrentUserResponse {
  const account = cuenta(permisos, cambios)
  setAuthToken('token-de-prueba')
  useSession.setState({ token: 'token-de-prueba', account, expired: false })
  return account
}

// Muestra la ruta actual para comprobar adónde llevó una navegación.
function DondeEstoy() {
  const { pathname, search } = useLocation()
  return createElement('output', { 'aria-label': 'Ruta actual' }, `${pathname}${search}`)
}

export interface Montaje extends RenderResult {
  readonly user: UserEvent
  readonly router: ReturnType<typeof createMemoryRouter>
}

interface OpcionesDeMontaje {
  /** La ruta con parámetros, como en el router (`/pedidos/:orderId`). */
  readonly path?: string
  /** La dirección en la que se abre (`/pedidos/12`). */
  readonly en?: string
  /** Otras rutas del router, además de la pantalla. */
  readonly rutas?: RouteObject[]
}

/** Monta una pantalla dentro de un router en memoria y con el caché de la aplicación. */
export function montar(pantalla: ReactElement, { path = '/', en = path, rutas = [] }: OpcionesDeMontaje = {}): Montaje {
  return montarRutas([{ path, element: pantalla }, ...rutas], en)
}

// React Router guarda lo que ya cargó de una ruta perezosa usando el objeto de
// la ruta como clave. Cada router de prueba recibe copias nuevas, o la segunda
// prueba que abre la misma pantalla la encuentra «cargada» y sin componente.
function copiar(rutas: readonly RouteObject[]): RouteObject[] {
  return rutas.map((ruta) => {
    const copia: RouteObject = { ...ruta }
    if (typeof ruta.lazy === 'object') {
      copia.lazy = { ...ruta.lazy }
    }
    if (ruta.children) {
      copia.children = copiar(ruta.children)
    }
    return copia
  })
}

/** Monta un router en memoria con estas rutas (p. ej. las de `src/router`). */
export function montarRutas(rutas: RouteObject[], en = '/'): Montaje {
  const router = createMemoryRouter([...copiar(rutas), { path: '*', element: createElement(DondeEstoy) }], {
    initialEntries: [en],
  })
  const user = userEvent.setup()
  // Los avisos (`useNotifications`) se ven como en el armazón de la aplicación.
  const resultado = render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
      createElement(ToastStack),
    ),
  )
  return { ...resultado, user, router }
}

beforeEach(() => {
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } })
})

afterEach(() => {
  queryClient.clear()
  api.defaults.adapter = adaptadorOriginal
  servidorActual = null
  setAuthToken(null)
  useSession.setState({ token: null, account: null, expired: false })
  if (usePlatformSession.getState().token !== null) {
    usePlatformSession.getState().signOut()
  }
  useNotifications.setState({ toasts: [] })
})
