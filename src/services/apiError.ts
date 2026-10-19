// El error de una petición al API y lo que se hace con él: el mensaje que se
// muestra, el código del error y si vale la pena repetir la consulta.
//
// El servidor responde `{ detail, code }`: `detail` es el texto en español para
// la persona y `code` (`ErrorCode`) es estable, pensado para que el programa
// decida. Ninguna decisión lee el texto; el código HTTP solo decide cuando el
// error no trae un código propio, como el de un proxy que responde por el
// servidor.
import type { ErrorCode } from '@/api/types'

const SERVER_ERROR = 500
const BAD_GATEWAY = 502
const GATEWAY_TIMEOUT = 504

/**
 * Por qué una petición no tuvo respuesta del servidor:
 * `network` (corte de red o servidor caído), `timeout` (se venció el plazo) o
 * `canceled` (quien la pidió la abortó).
 */
export type NoResponseReason = 'network' | 'timeout' | 'canceled'

interface ApiErrorInit {
  readonly method: string
  /** La ruta pedida, sin dirección de origen ni consulta. */
  readonly path: string
  readonly requestId: string
  /** El código HTTP; `undefined` si el servidor ni siquiera respondió. */
  readonly status?: number | undefined
  /** El cuerpo de la respuesta ya leído (`{ detail, code }` en el API), o `undefined` si no era JSON. */
  readonly body?: unknown
  /** Solo si no hubo respuesta: por qué. */
  readonly reason?: NoResponseReason | undefined
  readonly cause?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * El `code` que trae el cuerpo de un error del API, o `undefined` si no trae uno.
 *
 * El cuerpo viene del servidor y no se valida contra la lista: un código que
 * el cliente aún no conoce no coincide con ninguna decisión y cae en el caso general.
 */
export function codeOfBody(body: unknown): ErrorCode | undefined {
  const code = isRecord(body) ? body['code'] : undefined
  return typeof code === 'string' ? (code as ErrorCode) : undefined
}

/** Lo que falla en una petición al API: una respuesta con error o ninguna respuesta. */
export class ApiError extends Error {
  readonly method: string
  readonly path: string
  readonly requestId: string
  readonly status: number | undefined
  readonly body: unknown
  /** El código estable del error del servidor; `undefined` si no hubo respuesta o no traía uno. */
  readonly code: ErrorCode | undefined
  /** Por qué no hubo respuesta; `undefined` si el servidor respondió. */
  readonly reason: NoResponseReason | undefined

  constructor({ method, path, requestId, status, body, reason, cause }: ApiErrorInit) {
    super(status === undefined ? `Sin respuesta (${reason ?? 'network'})` : `Respondió ${String(status)}`, { cause })
    this.name = 'ApiError'
    this.method = method
    this.path = path
    this.requestId = requestId
    this.status = status
    this.body = body
    this.code = codeOfBody(body)
    this.reason = reason
  }
}

/** El código HTTP de un error del servidor, o `undefined` si no respondió. Para registrar y para los pactos de contrato; las decisiones usan `errorCode`. */
export function errorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined
}

/** El código estable de un error del servidor, o `undefined` si no es uno del API o no trae código. */
export function errorCode(error: unknown): ErrorCode | undefined {
  return error instanceof ApiError ? error.code : undefined
}

/** Si el error trae alguno de estos códigos. */
export function hasCode(error: unknown, ...codes: readonly ErrorCode[]): boolean {
  const code = errorCode(error)
  return code !== undefined && codes.includes(code)
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

// Credencial ausente, vencida o revocada; o la sesión que el tercer PIN equivocado cerró.
const SESSION_CODES: readonly ErrorCode[] = ['unauthenticated', 'invalid_token', 'unlock_attempts_exhausted']
// El servidor no pudo atender: la base de datos o el plazo máximo de atención (503).
const UNAVAILABLE_CODES: readonly ErrorCode[] = ['database_unavailable', 'request_timeout']
// El estado cambió mientras tanto: otro pago entró, otro cambio del pedido.
const CHANGED_CODES: readonly ErrorCode[] = ['conflict', 'balance_changed']
// La cuenta no puede abrir el canal de avisos: no sirve reconectar con la misma credencial.
const DENIED_CODES: readonly ErrorCode[] = [...SESSION_CODES, 'forbidden', 'missing_permission']

/** Si el código es el de una sesión vencida o revocada (no una contraseña equivocada al entrar: ese es `invalid_credentials`). */
export function isSessionCode(code: ErrorCode | undefined): boolean {
  return code !== undefined && SESSION_CODES.includes(code)
}

/** Si el error es una sesión vencida o revocada. */
export function isSessionEnded(error: unknown): boolean {
  return isSessionCode(errorCode(error))
}

/** Si la sesión está bloqueada por inactividad (423): se sigue al desbloquearla con el PIN. */
export function isSessionLocked(error: unknown): boolean {
  return hasCode(error, 'session_locked')
}

/** Si la cuenta todavía tiene la contraseña temporal (403 `password_change_required`, RFS-20). */
export function isPasswordChangeRequired(error: unknown): boolean {
  return hasCode(error, 'password_change_required')
}

/** Si a la cuenta le falta algo que el servidor exige antes (contraseña propia o dos pasos). */
function needsAccountSetup(error: ApiError): boolean {
  return isPasswordChangeRequired(error) || hasCode(error, 'two_factor_setup_required')
}

/** Si la plataforma pide activar antes la verificación en dos pasos (403 `two_factor_setup_required`). */
export function isTwoFactorSetupRequired(error: unknown): boolean {
  return hasCode(error, 'two_factor_setup_required')
}

/** Si el valor anti-CSRF que viajó ya no es el de la cookie de sesión (403 `csrf_token_invalid`). */
export function isCsrfInvalid(error: unknown): boolean {
  return hasCode(error, 'csrf_token_invalid')
}

/** Si la acción pide confirmar la contraseña antes (403 `reauthentication_required`). */
export function needsReauthentication(error: unknown): boolean {
  return hasCode(error, 'reauthentication_required')
}

/** Si el canal de avisos rechazó a la cuenta, y reconectar con la misma credencial no cambia nada. */
export function isDenied(code: ErrorCode | undefined): boolean {
  return code !== undefined && DENIED_CODES.includes(code)
}

// Un error sin código propio no lo levantó el API: es el proxy o un 500 sin cuerpo.
function hasOwnCode(error: ApiError): boolean {
  return error.code !== undefined && error.code !== 'http_error'
}

/**
 * Si el servidor no pudo atender, y no la petición: sin respuesta o con un
 * código de servicio caído. Un error sin código propio (el proxy, un 500 sin
 * cuerpo) se juzga por su estado.
 */
function isServerFault(error: ApiError): boolean {
  const { status } = error
  if (status === undefined) return true
  if (hasOwnCode(error)) return hasCode(error, ...UNAVAILABLE_CODES)
  return status >= SERVER_ERROR
}

/** Si la petición no llegó a tener respuesta: un corte de red, el plazo vencido o una cancelación. */
export function hasNoResponse(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status === undefined
}

/**
 * Si el servidor ni siquiera llegó a atender: sin respuesta, un servicio caído
 * o el proxy delante respondiendo por él (502, 503 y 504).
 */
export function isUnreachable(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status === undefined) return true
  if (hasOwnCode(error)) return hasCode(error, ...UNAVAILABLE_CODES)
  return error.status >= BAD_GATEWAY && error.status <= GATEWAY_TIMEOUT
}

/**
 * Si el fallo es del servidor o de la red y no de la petición: sin respuesta,
 * un servicio caído o el estado que cambió mientras tanto (el pedido cambió).
 * Una sesión vencida la resuelve el cierre de sesión, no es un corte.
 */
export function isTransportFailure(error: ApiError): boolean {
  if (error.reason === 'canceled' || isSessionEnded(error) || isSessionLocked(error) || needsAccountSetup(error)) return false
  return isServerFault(error) || hasCode(error, ...CHANGED_CODES)
}

/**
 * Si vale la pena repetir una consulta que falló.
 *
 * Un rechazo del servidor (dato inválido, sesión vencida, permiso) no cambia
 * por repetir la petición, y reintentar solo demora el aviso. Un corte de red o
 * un servicio caído, quizá sí.
 */
export function shouldRetry(failures: number, error: unknown): boolean {
  if (error instanceof ApiError && !isServerFault(error)) {
    return false
  }
  return failures < 1
}
