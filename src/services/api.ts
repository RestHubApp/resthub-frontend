// El único punto de red de la aplicación: el cliente tipado de `openapi-fetch`
// con lo que cada petición lleva o provoca.
//
// - la credencial de la sesión dueña de la ruta (`apiCredentials`);
// - un identificador de petición que el servidor repite en sus logs;
// - un plazo, y la cancelación de quien la pidió;
// - el cierre de sesión ante un 401 y el recuerdo de los cortes (`apiFailure`);
// - el registro de lo que pasó (`logger`).
//
// El cliente no lanza ante un error HTTP; aquí se lanza un `ApiError` para que
// TanStack Query reintente, las pantallas muestren `errorMessage` y la cola
// sin señal distinga un corte de un rechazo del servidor.
import createClient, { type Client } from 'openapi-fetch'

import { bearerFor, expireSessionOf } from './apiCredentials'
import { ApiError, errorMessage, isSessionEnded, isTransportFailure, type NoResponseReason } from './apiError'
import { clearApiFailureOf, noteApiFailure, type ApiFailureScope } from './apiFailure'
import { apiOrigin } from './apiRouting'
import { logger } from './logger'
import { anyOf } from './signals'

/** El cliente tipado de un contrato OpenAPI (`openapi-typescript`). */
export type ApiClient<TPaths extends object> = Client<TPaths>

// El mismo nombre que usa el backend. El identificador lo genera el navegador
// y el servidor lo respeta, así un error de la consola y su línea en los logs
// del servidor se encuentran buscando el mismo valor.
const REQUEST_ID_HEADER = 'X-Request-ID'

const SERVER_ERROR = 500

// Sin límite, una conexión colgada deja la petición abierta para siempre: el
// pedido nunca cae en la cola sin señal y el botón se queda en «Enviando…».
// Vencido el plazo, la petición falla sin respuesta, igual que un corte de red.
const TIMEOUT_MS = 15_000

/** El plazo de lo que tarda de verdad: la IA decidiendo o el proveedor de comprobantes. */
export const SLOW_TIMEOUT_MS = 60_000

/** Lo que cambia cómo sale y cómo se trata una petición. */
export interface CallOptions {
  /** El plazo en milisegundos; por defecto 15 s. */
  readonly timeout?: number | undefined
  /**
   * Una lectura de fondo (la cuenta que se refresca cada tanto): si falla, no
   * deja el aviso de corte en el armazón, porque nada en pantalla depende de
   * ella y se vuelve a pedir sola.
   */
  readonly background?: boolean | undefined
  /**
   * La petición sale sin credencial aunque haya una sesión abierta, y su 401
   * no cierra ninguna. Es para lo que abre una sesión nueva sin depender de
   * la actual: canjear un código de vista previa en una pestaña que ya
   * muestra otra vista previa no manda el token de esa vista previa.
   */
  readonly withoutCredential?: boolean | undefined
}

interface Success<TData> {
  readonly data: TData
  readonly error?: never
  readonly response: Response
}

/** Lo que devuelve el cliente tipado: el cuerpo de éxito o el de error, según el código HTTP. */
export type ApiResult<TData, TError> =
  | Success<TData>
  | { readonly data?: never; readonly error: TError; readonly response: Response }

function isSuccess<TData, TError>(result: ApiResult<TData, TError>): result is Success<TData> {
  return result.error === undefined
}

const httpLogger = logger.child({ module: 'http' })

/**
 * Un identificador de petición.
 *
 * `crypto.randomUUID` solo existe en un contexto seguro (HTTPS o localhost).
 * Servida por HTTP en otra dirección, la aplicación no puede dejar de hacer
 * peticiones por eso, así que arma uno con `getRandomValues`.
 */
function newRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Una petición en curso: lo que se decidió al salir y servirá al terminar. */
interface Exchange {
  readonly request: Request
  readonly options: CallOptions
  readonly id: string
  readonly hasCredential: boolean
  readonly started: number
}

function prepare(request: Request, options: CallOptions): Exchange {
  const id = newRequestId()
  request.headers.set(REQUEST_ID_HEADER, id)
  const token = options.withoutCredential === true ? null : bearerFor(request.url)
  // eslint-disable-next-line security/detect-possible-timing-attacks -- compara con null, no con un secreto: el cliente no verifica credenciales
  if (token !== null) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return { request, options, id, hasCredential: token !== null, started: performance.now() }
}

function pathOf(request: Request): string {
  return new URL(request.url).pathname
}

function isRead(request: Request): boolean {
  return request.method.toUpperCase() === 'GET'
}

// Solo las lecturas: una escritura que falla la avisa su propio formulario o
// su aviso emergente, y recordarla dejaba el mensaje en el armazón después de
// cerrar la ventana.
function scopeOf(path: string): ApiFailureScope {
  return path.includes('/platform/') ? 'platform' : 'restaurant'
}

function logOf(current: Exchange, extra: object) {
  return {
    method: current.request.method.toLowerCase(),
    url: pathOf(current.request),
    requestId: current.id,
    durationMs: Math.round(performance.now() - current.started),
    ...extra,
  }
}

// Sin respuesta es un corte de red o un servidor caído. Un 4xx es la
// respuesta esperada a un dato inválido: se anota como aviso, no como error.
function registerFailure(current: Exchange, error: ApiError): void {
  const data = logOf(current, { status: error.status, code: error.code, reason: error.reason })
  if (error.reason === 'canceled') {
    httpLogger.debug(data, 'http.request_canceled')
  } else if (error.status === undefined || error.status >= SERVER_ERROR) {
    httpLogger.error(data, 'http.request_failed')
  } else {
    httpLogger.warn(data, 'http.request_rejected')
  }
}

function rememberTransportFailure(current: Exchange, error: ApiError): void {
  if (!isTransportFailure(error) || !isRead(current.request) || current.options.background === true) return
  noteApiFailure(
    scopeOf(error.path),
    errorMessage(error, 'No se pudieron cargar los datos. Comprueba la conexión e inténtalo de nuevo.'),
  )
}

/**
 * Anota el fallo y lo lanza.
 *
 * Un error de sesión (`unauthenticated`, `invalid_token`) de una petición que
 * llevaba credencial es una sesión vencida o revocada. Seguir mostrando pantallas vacías confunde: se cierra la sesión
 * y el acceso explica qué pasó. Un rechazo sin credencial, como una contraseña
 * equivocada al entrar (`invalid_credentials`), lo resuelve su propio formulario. Se cierra solo
 * la sesión dueña de la ruta: la otra sigue abierta.
 */
function fail(current: Exchange, error: ApiError): never {
  registerFailure(current, error)
  rememberTransportFailure(current, error)
  if (current.hasCredential && isSessionEnded(error)) {
    expireSessionOf(current.request.url)
  }
  throw error
}

function errorOf(current: Exchange, failure: { status?: number; body?: unknown; reason?: NoResponseReason; cause?: unknown }): ApiError {
  return new ApiError({ method: current.request.method.toLowerCase(), path: pathOf(current.request), requestId: current.id, ...failure })
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return JSON.parse(await response.text())
  } catch {
    return undefined
  }
}

// Una lectura que responde (por ejemplo, el «Reintentar» de la pantalla)
// descarta el corte recordado: si no, el aviso de respaldo del armazón
// aparecía justo cuando la pantalla ya se había recuperado.
async function settle(current: Exchange, response: Response): Promise<Response> {
  if (!response.ok) {
    return fail(current, errorOf(current, { status: response.status, body: await readBody(response) }))
  }
  httpLogger.debug(logOf(current, { status: response.status }), 'http.request_completed')
  if (isRead(current.request)) clearApiFailureOf(scopeOf(pathOf(current.request)))
  return response
}

/** El plazo de una petición: una señal que se aborta al vencer o cuando se aborta la de quien la pidió. */
function startTimer(signal: AbortSignal, ms: number) {
  const expired = new AbortController()
  const timer = setTimeout(() => {
    expired.abort()
  }, ms)
  return {
    signal: anyOf(signal, expired.signal),
    hasExpired: () => expired.signal.aborted,
    stop: () => {
      clearTimeout(timer)
    },
  }
}

function reasonOf(request: Request, hasExpired: boolean): NoResponseReason {
  if (request.signal.aborted) return 'canceled'
  return hasExpired ? 'timeout' : 'network'
}

// El plazo cubre hasta que llegan las cabeceras de la respuesta; el cuerpo, un
// JSON corto, se lee enseguida.
async function exchange(request: Request, options: CallOptions): Promise<Response> {
  const current = prepare(request, options)
  const timer = startTimer(request.signal, options.timeout ?? TIMEOUT_MS)
  try {
    return await settle(current, await fetch(request, { signal: timer.signal }))
  } catch (cause) {
    if (cause instanceof ApiError) throw cause
    return fail(current, errorOf(current, { reason: reasonOf(request, timer.hasExpired()), cause }))
  } finally {
    timer.stop()
  }
}

/**
 * Hace una petición con el cliente tipado y devuelve su cuerpo de éxito.
 *
 * `run` recibe el cliente ya armado (dirección, cabeceras, credencial y plazo)
 * y llama al método y la ruta del contrato: `(client) => client.GET('/api/v1/tables')`.
 * Si el servidor responde con un error, o no responde, rechaza con `ApiError`.
 */
export async function call<TPaths extends object, TData, TError>(
  run: (client: Client<TPaths>) => Promise<ApiResult<TData, TError>>,
  options: CallOptions = {},
): Promise<TData> {
  const client = createClient<TPaths>({
    baseUrl: apiOrigin(),
    headers: { Accept: 'application/json' },
    fetch: (request) => exchange(request, options),
  })
  const result = await run(client)
  if (isSuccess(result)) {
    return result.data
  }
  // El transporte ya rechaza cualquier código de error; esto es lo que queda si el
  // servidor contestó un éxito con un cuerpo de error.
  throw new ApiError({ method: 'unknown', path: '', requestId: '', status: result.response.status, body: result.error })
}
