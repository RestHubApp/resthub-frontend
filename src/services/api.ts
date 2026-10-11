import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

import { clearApiFailureOf, noteApiFailure, type ApiFailureScope } from './apiFailure'
import { logger } from './logger'

const API_PREFIX = '/api/v1'

// El mismo nombre que usa el backend. El identificador lo genera el navegador
// y el servidor lo respeta, asi un error de la consola y su linea en los logs
// del servidor se encuentran buscando el mismo valor.
const REQUEST_ID_HEADER = 'X-Request-ID'

const SERVER_ERROR = 500
const CLIENT_ERROR = 400
const UNAUTHORIZED = 401

// Sin limite, una conexion colgada deja la peticion abierta para siempre: el
// pedido nunca cae en la cola sin senal y el boton se queda en «Enviando…».
// Vencido el plazo, Axios falla sin respuesta, igual que un corte de red.
const TIMEOUT_MS = 15_000

/** El plazo de lo que tarda de verdad: la IA decidiendo o el proveedor de comprobantes. */
export const SLOW_TIMEOUT_MS = 60_000

// Las dos sesiones que pueden estar abiertas en el mismo navegador: la de una
// cuenta de restaurante y la del administrador del sistema. Las registran sus
// almacenes; los servicios son la capa mas baja y no pueden importarlos.
interface Credential {
  token: string | null
  onExpire: (() => void) | null
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * La petición sale sin credencial aunque haya una sesión abierta, y su 401
     * no cierra ninguna. Es para lo que abre una sesión nueva sin depender de
     * la actual: canjear un código de vista previa en una pestaña que ya
     * muestra otra vista previa no manda el token de esa vista previa.
     */
    withoutCredential?: boolean
    /**
     * Una lectura de fondo (la cuenta que se refresca cada tanto): si falla,
     * no deja el aviso de corte en el armazón, porque nada en pantalla depende
     * de ella y se vuelve a pedir sola.
     */
    background?: boolean
  }
}

const restaurant: Credential = { token: null, onExpire: null }
const platform: Credential = { token: null, onExpire: null }

/** El prefijo de las rutas del administrador del sistema, relativo a `/api/v1`. */
const PLATFORM_PREFIX = '/platform'

/** Lo que decide adónde va una petición: la ruta y, si la hay, su propia base o sus parámetros. */
export type RequestTarget = string | undefined | AxiosRequestConfig

type Destination = 'restaurant' | 'platform' | 'foreign'

// Sin navegador (las pruebas) no hay origen de la página: se usa uno fijo.
function pageOrigin(): string {
  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin
}

function urlDe(destination: RequestTarget): URL | null {
  const config = typeof destination === 'object' ? destination : { url: destination ?? '' }
  try {
    // `getUri` junta la base, la ruta y los parámetros como lo hará Axios al
    // enviar; `URL` resuelve los `..` y una ruta sin barra inicial.
    return new URL(api.getUri(config), pageOrigin())
  } catch {
    return null
  }
}

/**
 * A quién pertenece la petición, mirando la dirección final y no el texto de
 * la ruta: `platform/x` sin barra es de plataforma, `/platform/../orders` no,
 * y una dirección de otro origen (`https://otro.com/…`, `//otro.com/…`) no
 * es de ninguna sesión.
 */
function destinationOf(destination: RequestTarget): Destination {
  const base = urlDe({ url: '' })
  const url = base === null ? null : urlDe(destination)
  if (base === null || url?.origin !== base.origin) {
    return 'foreign'
  }
  const platformValue = `${base.pathname.replace(/\/$/u, '')}${PLATFORM_PREFIX}`
  return url.pathname === platformValue || url.pathname.startsWith(`${platformValue}/`) ? 'platform' : 'restaurant'
}

/**
 * Si una petición es del administrador del sistema.
 *
 * Solo cuenta el prefijo completo: `/platformas` o `/restaurant/platform` no
 * lo son. La consulta (`?search=`) no cambia a quien pertenece la ruta.
 */
export function isPlatformPath(destination: RequestTarget): boolean {
  return destinationOf(destination) === 'platform'
}

/** Los tokens abiertos en este momento, por sesion. */
export interface SessionTokens {
  readonly restaurant: string | null
  readonly platform: string | null
}

/**
 * El token que acompaña a una petición.
 *
 * Cada sesión viaja solo a sus rutas: el token de plataforma nunca sale hacia
 * un endpoint de restaurante ni el de restaurante hacia `/platform/*`. El
 * servidor rechazaría la mezcla con 401, pero ademas no tiene por que verla.
 * Una petición a otro origen que el del API no lleva ninguno.
 */
export function tokenFor(destination: RequestTarget, tokens: SessionTokens): string | null {
  switch (destinationOf(destination)) {
    case 'platform':
      return tokens.platform
    case 'restaurant':
      return tokens.restaurant
    case 'foreign':
      return null
  }
}

function credentialOf(destination: RequestTarget): Credential {
  return isPlatformPath(destination) ? platform : restaurant
}

/** Qué hacer cuando el servidor rechaza la credencial de una petición de restaurante. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  restaurant.onExpire = handler
}

/** Lo mismo, para las peticiones del administrador del sistema. */
export function setPlatformUnauthorizedHandler(handler: (() => void) | null): void {
  platform.onExpire = handler
}

/**
 * Si vale la pena repetir una consulta que falló.
 *
 * Un 4xx no cambia por repetir la petición: un 401 de una sesión vencida
 * reintentado solo demora el aviso. Un corte de red o un 5xx, quizá sí.
 */
export function shouldRetry(failures: number, error: unknown): boolean {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  if (status !== undefined && status >= CLIENT_ERROR && status < SERVER_ERROR) {
    return false
  }
  return failures < 1
}

/**
 * La direccion base del API.
 *
 * En desarrollo `VITE_API_URL` queda vacia y las peticiones salen al mismo
 * origen, donde el proxy de Vite las reenvia al backend. En produccion es el
 * origen del backend, que vive en otro dominio.
 */
function apiBaseUrl(): string {
  const origin = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/u, '')
  return `${origin}${API_PREFIX}`
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const httpLogger = logger.child({ module: 'http' })

// Cuando empezo cada peticion, para anotar su duracion. Un WeakMap no retiene
// la configuracion de una peticion que ya termino.
const starts = new WeakMap<InternalAxiosRequestConfig, number>()

/**
 * Un identificador de peticion.
 *
 * `crypto.randomUUID` solo existe en un contexto seguro (HTTPS o localhost).
 * Servida por HTTP en otra direccion, la aplicacion no puede dejar de hacer
 * peticiones por eso, asi que arma uno con `getRandomValues`.
 */
function newRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function durationMs(config: InternalAxiosRequestConfig | undefined): number | undefined {
  const start = config === undefined ? undefined : starts.get(config)
  return start === undefined ? undefined : Math.round(performance.now() - start)
}

function registerFailure(error: unknown): void {
  if (!axios.isAxiosError(error)) {
    httpLogger.error({ err: error }, 'http.request_failed')
    return
  }
  const { config, response } = error
  const data = {
    method: config?.method,
    url: config?.url,
    status: response?.status,
    code: error.code,
    requestId: config?.headers.get(REQUEST_ID_HEADER),
    durationMs: durationMs(config),
  }
  // Sin respuesta es un corte de red o un servidor caido. Un 4xx es la
  // respuesta esperada a un dato invalido: se anota como aviso, no como error.
  if (response === undefined || response.status >= SERVER_ERROR) {
    httpLogger.error(data, 'http.request_failed')
    return
  }
  httpLogger.warn(data, 'http.request_rejected')
}

api.interceptors.request.use((config) => {
  config.headers.set(REQUEST_ID_HEADER, newRequestId())
  const token =
    config.withoutCredential === true
      ? null
      : tokenFor(config, { restaurant: restaurant.token, platform: platform.token })
  // eslint-disable-next-line security/detect-possible-timing-attacks -- compara con null, no con un secreto: el cliente no verifica credenciales
  if (token !== null) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  starts.set(config, performance.now())
  return config
})

api.interceptors.response.use(
  (response) => {
    httpLogger.debug(
      {
        method: response.config.method,
        url: response.config.url,
        status: response.status,
        durationMs: durationMs(response.config),
      },
      'http.request_completed',
    )
    forgetTransportFailure(response.config)
    return response
  },
  (error: unknown) => {
    registerFailure(error)
    rememberTransportFailure(error)
    // Un 401 de una petición que llevaba credencial es una sesión vencida o
    // revocada. Seguir mostrando pantallas vacías confunde: se cierra la sesión
    // y el acceso explica qué pasó. Un 401 sin credencial, como una contraseña
    // equivocada al entrar, lo resuelve su propio formulario. Se cierra solo
    // la sesión dueña de la ruta: la otra sigue abierta.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === UNAUTHORIZED &&
      error.config?.headers.has('Authorization') === true
    ) {
      credentialOf(error.config).onExpire?.()
    }
    throw error
  },
)

/**
 * Pone o quita la credencial que acompana a cada peticion de restaurante.
 *
 * La llama el almacen de sesion, nunca al reves: los servicios son la capa mas
 * baja y no pueden conocer el estado de cliente. Asi el token vive en un solo
 * lugar y ninguna pantalla tiene que acordarse de adjuntarlo.
 */
export function setAuthToken(token: string | null): void {
  restaurant.token = token
}

/** La credencial de las peticiones a `/platform/*`. La llama el almacen de la sesion de plataforma. */
export function setPlatformAuthToken(token: string | null): void {
  platform.token = token
}

/** El token de restaurante abierto, para lo que no viaja por Axios (el canal de avisos). */
export function currentAuthToken(): string | null {
  return restaurant.token
}

/**
 * Forma del cuerpo de error que devuelve FastAPI.
 *
 * `detail` es un texto cuando lo levanta el proyecto y una lista de problemas
 * por campo cuando lo levanta la validacion de Pydantic.
 */
interface ApiErrorBody {
  detail?: string | { msg?: string }[]
}

function isTransportFailure(error: AxiosError): boolean {
  const status = error.response?.status
  if (status === UNAUTHORIZED) return false
  if (error.response === undefined || status === 409) return true
  return status !== undefined && status >= SERVER_ERROR
}

// Solo las lecturas: una escritura que falla la avisa su propio formulario o
// su aviso emergente, y recordarla dejaba el mensaje en el armazón después de
// cerrar la ventana.
function scopeOf(url: string | undefined): ApiFailureScope {
  return (url ?? '').includes('/platform/') ? 'platform' : 'restaurant'
}

// Una lectura que responde (por ejemplo, el «Reintentar» de la pantalla)
// descarta el corte recordado: si no, el aviso de respaldo del armazón
// aparecía justo cuando la pantalla ya se había recuperado.
function forgetTransportFailure(config: InternalAxiosRequestConfig): void {
  if ((config.method ?? 'get').toLowerCase() === 'get') clearApiFailureOf(scopeOf(config.url))
}

function rememberTransportFailure(error: unknown): void {
  if (!axios.isAxiosError(error) || !isTransportFailure(error)) return
  if ((error.config?.method ?? 'get').toLowerCase() !== 'get') return
  if (error.config?.background === true) return
  const scope = scopeOf(error.config?.url)
  noteApiFailure(
    scope,
    errorMessage(error, 'No se pudieron cargar los datos. Comprueba la conexión e inténtalo de nuevo.'),
  )
}

export function errorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return fallback
  }

  const detail = error.response?.data.detail
  if (typeof detail === 'string') {
    return detail
  }
  return detail?.[0]?.msg ?? fallback
}

/** El código HTTP de un error del servidor, o `undefined` si ni siquiera llegó a responder. */
export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}
