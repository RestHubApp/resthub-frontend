// El error de una petición al API y lo que se hace con él: el mensaje que se
// muestra, el código HTTP y si vale la pena repetir la consulta.

const SERVER_ERROR = 500
const CLIENT_ERROR = 400
const UNAUTHORIZED = 401
const CONFLICT = 409

/**
 * Por qué una petición no tuvo respuesta del servidor:
 * `network` (corte de red o servidor caído), `timeout` (se venció el plazo) o
 * `canceled` (quien la pidió la abortó).
 */
export type ApiErrorCode = 'network' | 'timeout' | 'canceled'

interface ApiErrorInit {
  readonly method: string
  /** La ruta pedida, sin dirección de origen ni consulta. */
  readonly path: string
  readonly requestId: string
  /** El código HTTP; `undefined` si el servidor ni siquiera respondió. */
  readonly status?: number | undefined
  /** El cuerpo de la respuesta ya leído (`{ detail }` en FastAPI), o `undefined` si no era JSON. */
  readonly body?: unknown
  readonly code?: ApiErrorCode | undefined
  readonly cause?: unknown
}

/** Lo que falla en una petición al API: una respuesta con error o ninguna respuesta. */
export class ApiError extends Error {
  readonly method: string
  readonly path: string
  readonly requestId: string
  readonly status: number | undefined
  readonly body: unknown
  readonly code: ApiErrorCode | undefined

  constructor({ method, path, requestId, status, body, code, cause }: ApiErrorInit) {
    super(status === undefined ? `Sin respuesta (${code ?? 'network'})` : `Respondió ${String(status)}`, { cause })
    this.name = 'ApiError'
    this.method = method
    this.path = path
    this.requestId = requestId
    this.status = status
    this.body = body
    this.code = code
  }
}

/** El código HTTP de un error del servidor, o `undefined` si ni siquiera llegó a responder. */
export function errorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// `detail` es un texto cuando lo levanta el proyecto y una lista de problemas
// por campo (`[{ msg }]`) cuando lo levanta la validación de Pydantic.
function detailOf(body: unknown): string | undefined {
  const detail = isRecord(body) ? body['detail'] : undefined
  if (typeof detail === 'string') {
    return detail
  }
  const first: unknown = Array.isArray(detail) ? detail[0] : undefined
  const message = isRecord(first) ? first['msg'] : undefined
  return typeof message === 'string' ? message : undefined
}

/** El mensaje del servidor para una petición que falló, o `fallback` si no trae uno. */
export function errorMessage(error: unknown, fallback: string): string {
  return (error instanceof ApiError ? detailOf(error.body) : undefined) ?? fallback
}

/**
 * Si el fallo es del servidor o de la red y no de la petición: sin respuesta,
 * un 5xx o un 409 (el pedido cambió mientras tanto). Un 401 es una sesión
 * vencida, que resuelve el cierre de sesión, no un corte.
 */
export function isTransportFailure(error: ApiError): boolean {
  if (error.code === 'canceled' || error.status === UNAUTHORIZED) return false
  return error.status === undefined || error.status === CONFLICT || error.status >= SERVER_ERROR
}

/**
 * Si vale la pena repetir una consulta que falló.
 *
 * Un 4xx no cambia por repetir la petición: un 401 de una sesión vencida
 * reintentado solo demora el aviso. Un corte de red o un 5xx, quizá sí.
 */
export function shouldRetry(failures: number, error: unknown): boolean {
  const status = errorStatus(error)
  if (status !== undefined && status >= CLIENT_ERROR && status < SERVER_ERROR) {
    return false
  }
  return failures < 1
}
