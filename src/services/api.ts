import axios, { type InternalAxiosRequestConfig } from 'axios'

import { logger } from './logger'

const API_PREFIX = '/api/v1'

// El mismo nombre que usa el backend. El identificador lo genera el navegador
// y el servidor lo respeta, asi un error de la consola y su linea en los logs
// del servidor se encuentran buscando el mismo valor.
export const REQUEST_ID_HEADER = 'X-Request-ID'

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
  alVencer: (() => void) | null
}

const restaurante: Credential = { token: null, alVencer: null }
const plataforma: Credential = { token: null, alVencer: null }

/** El prefijo de las rutas del administrador del sistema, relativo a `/api/v1`. */
export const PLATFORM_PREFIX = '/platform'

/**
 * Si una ruta del API es del administrador del sistema.
 *
 * Solo cuenta el prefijo completo: `/platformas` o `/restaurant/platform` no
 * lo son. La consulta (`?search=`) no cambia a quien pertenece la ruta.
 */
export function isPlatformPath(url: string | undefined): boolean {
  const ruta = (url ?? '').split('?')[0] ?? ''
  return ruta === PLATFORM_PREFIX || ruta.startsWith(`${PLATFORM_PREFIX}/`)
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
 */
export function tokenFor(url: string | undefined, tokens: SessionTokens): string | null {
  return isPlatformPath(url) ? tokens.platform : tokens.restaurant
}

function credentialOf(url: string | undefined): Credential {
  return isPlatformPath(url) ? plataforma : restaurante
}

/** Qué hacer cuando el servidor rechaza la credencial de una petición de restaurante. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  restaurante.alVencer = handler
}

/** Lo mismo, para las peticiones del administrador del sistema. */
export function setPlatformUnauthorizedHandler(handler: (() => void) | null): void {
  plataforma.alVencer = handler
}

/**
 * Si vale la pena repetir una consulta que falló.
 *
 * Un 4xx no cambia por repetir la petición: un 401 de una sesión vencida
 * reintentado solo demora el aviso. Un corte de red o un 5xx, quizá sí.
 */
export function debeReintentar(fallos: number, error: unknown): boolean {
  const estado = axios.isAxiosError(error) ? error.response?.status : undefined
  if (estado !== undefined && estado >= CLIENT_ERROR && estado < SERVER_ERROR) {
    return false
  }
  return fallos < 1
}

/**
 * La direccion base del API.
 *
 * En desarrollo `VITE_API_URL` queda vacia y las peticiones salen al mismo
 * origen, donde el proxy de Vite las reenvia al backend. En produccion es el
 * origen del backend, que vive en otro dominio.
 */
function apiBaseUrl(): string {
  const origen = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/u, '')
  return `${origen}${API_PREFIX}`
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
const inicios = new WeakMap<InternalAxiosRequestConfig, number>()

/**
 * Un identificador de peticion.
 *
 * `crypto.randomUUID` solo existe en un contexto seguro (HTTPS o localhost).
 * Servida por HTTP en otra direccion, la aplicacion no puede dejar de hacer
 * peticiones por eso, asi que arma uno con `getRandomValues`.
 */
function nuevoIdDePeticion(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function duracionMs(config: InternalAxiosRequestConfig | undefined): number | undefined {
  const inicio = config === undefined ? undefined : inicios.get(config)
  return inicio === undefined ? undefined : Math.round(performance.now() - inicio)
}

function registrarFallo(error: unknown): void {
  if (!axios.isAxiosError(error)) {
    httpLogger.error({ err: error }, 'http.request_failed')
    return
  }
  const { config, response } = error
  const datos = {
    method: config?.method,
    url: config?.url,
    status: response?.status,
    code: error.code,
    requestId: config?.headers.get(REQUEST_ID_HEADER),
    durationMs: duracionMs(config),
  }
  // Sin respuesta es un corte de red o un servidor caido. Un 4xx es la
  // respuesta esperada a un dato invalido: se anota como aviso, no como error.
  if (response === undefined || response.status >= SERVER_ERROR) {
    httpLogger.error(datos, 'http.request_failed')
    return
  }
  httpLogger.warn(datos, 'http.request_rejected')
}

api.interceptors.request.use((config) => {
  config.headers.set(REQUEST_ID_HEADER, nuevoIdDePeticion())
  const token = tokenFor(config.url, { restaurant: restaurante.token, platform: plataforma.token })
  if (token !== null) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  inicios.set(config, performance.now())
  return config
})

api.interceptors.response.use(
  (response) => {
    httpLogger.debug(
      {
        method: response.config.method,
        url: response.config.url,
        status: response.status,
        durationMs: duracionMs(response.config),
      },
      'http.request_completed',
    )
    return response
  },
  (error: unknown) => {
    registrarFallo(error)
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
      credentialOf(error.config.url).alVencer?.()
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
  restaurante.token = token
}

/** La credencial de las peticiones a `/platform/*`. La llama el almacen de la sesion de plataforma. */
export function setPlatformAuthToken(token: string | null): void {
  plataforma.token = token
}

/** El token de restaurante abierto, para lo que no viaja por Axios (el canal de avisos). */
export function currentAuthToken(): string | null {
  return restaurante.token
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
