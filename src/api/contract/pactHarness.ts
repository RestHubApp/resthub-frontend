import path from 'node:path'

import { MatchersV3, PactV4, type V3MockServer } from '@pact-foundation/pact'

import { api, setAuthToken, setPlatformAuthToken } from '../../services/api'

// Lo que comparten las pruebas de contrato del consumidor.
//
// Cada prueba declara una interacción (lo que el frontend manda y lo que
// necesita de vuelta) y la ejercita con las funciones reales de `src/api`,
// que salen por el cliente Axios real contra el servidor simulado de Pact.
// Al terminar, Pact escribe el contrato en `pacts/`; el backend lo verifica
// contra su aplicación real.

export const CONSUMER = 'resthub-frontend'
export const PROVIDER = 'resthub-backend'

/** Donde Pact escribe el contrato: `pacts/resthub-frontend-resthub-backend.json`. */
export const PACT_DIR = path.resolve(process.cwd(), 'pacts')

export const API_PREFIX = '/api/v1'

export const { like, eachLike, integer, boolean, regex, fromProviderState, string, nullValue, arrayContaining } =
  MatchersV3

// Estados del proveedor. El texto es la clave que el backend busca en su
// ruta de estados (tests/contract/provider_app.py): cambiarlo acá obliga a
// cambiarlo allá.
export const STATE = {
  ownerAccount: 'existe la cuenta del encargado',
  ownerSession: 'el encargado tiene sesión',
  waiterSession: 'el mesero tiene sesión',
  platformSession: 'el administrador del sistema tiene sesión',
  freeTable: 'hay una mesa libre',
  openOrder: 'hay un pedido abierto en una mesa',
  servedOrder: 'hay un pedido servido y la caja abierta',
  balanceChanged: 'otro pago cambió el saldo del pedido servido',
  cashOpen: 'la caja está abierta',
  paidOrder: 'hay un pedido pagado sin comprobante',
  invoicedOrder: 'hay un pedido pagado con su boleta emitida',
  foreignOrder: 'hay un pedido de otro restaurante',
} as const

/** La contraseña de las cuentas de la semilla de desarrollo (README del backend). */
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- es la de la semilla local, pública en el README; no protege nada real
export const SEED_PASSWORD = 'resthub123'

/**
 * El error con que termina una petición que se espera rechazada.
 *
 * Si la petición no falla, la prueba tampoco puede pasar: devuelve un error propio.
 */
export async function rejectionOf(request: Promise<unknown>): Promise<unknown> {
  try {
    await request
  } catch (error: unknown) {
    return error
  }
  return new Error('Se esperaba que el servidor rechazara la petición.')
}

/** Un token de ejemplo: en la verificación, el backend pone uno real de la cuenta del estado. */
export const EXAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.contrato.firma'

/** La cabecera de la sesión: el valor real lo inyecta el estado del proveedor. */
export function bearer() {
  return { Authorization: fromProviderState('Bearer ${token}', `Bearer ${EXAMPLE_TOKEN}`) }
}

/** Una ruta con un identificador que crea el estado del proveedor (`${orderId}`). */
export function statePath(template: string, example: string) {
  return fromProviderState(`${API_PREFIX}${template}`, `${API_PREFIX}${example}`)
}

/** Soles como los manda el API: texto decimal con dos decimales. */
export function money(example: string) {
  return regex(/^-?\d+\.\d{2}$/u, example)
}

/** Fecha y hora ISO 8601 con zona: `new Date()` la lee sin suponer la del navegador. */
export function isoDatetime(example = '2026-09-26T19:30:00.000000Z') {
  // eslint-disable-next-line security/detect-unsafe-regex -- los cuantificadores son fijos salvo la fracción opcional, anclada entre literales; el patrón lo evalúa Pact contra respuestas de prueba
  return regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/u, example)
}

/** Fecha ISO sin hora (el día de negocio del local). */
export function isoDate(example = '2026-09-26') {
  return regex(/^\d{4}-\d{2}-\d{2}$/u, example)
}

/** Uno de los valores de un enumerado del API. */
export function oneOf(values: readonly string[], example: string) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- los valores son los enumerados que escribe la propia prueba, no datos externos
  return regex(new RegExp(`^(${values.join('|')})$`, 'u'), example)
}

/** El cuerpo de error de FastAPI cuando lo levanta el proyecto: `detail` es un texto. */
export function errorBody(example: string) {
  return { detail: string(example) }
}

export const JSON_HEADERS = { 'Content-Type': 'application/json' }

/** El contrato que escriben todas las pruebas de un archivo. */
export function newPact(): PactV4 {
  return new PactV4({ consumer: CONSUMER, provider: PROVIDER, dir: PACT_DIR, logLevel: 'warn' })
}

/**
 * Apunta el cliente real al servidor simulado y abre las sesiones de ejemplo.
 *
 * Solo cambia la base de Axios: los interceptores (identificador de petición,
 * token por ruta, cierre de sesión en un 401) son los de la aplicación.
 */
export function connectTo(mockServer: V3MockServer): void {
  api.defaults.baseURL = `${mockServer.url}${API_PREFIX}`
  setAuthToken(EXAMPLE_TOKEN)
  setPlatformAuthToken(EXAMPLE_TOKEN)
}

/** Sin sesión abierta: el acceso sale sin credencial. */
export function connectWithoutSession(mockServer: V3MockServer): void {
  api.defaults.baseURL = `${mockServer.url}${API_PREFIX}`
  setAuthToken(null)
  setPlatformAuthToken(null)
}
