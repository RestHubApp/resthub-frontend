// Dónde está el API y a quién se le manda la credencial.
//
// La sesión viaja solo al API, y esto se decide mirando la dirección final y
// no el texto de la ruta.

const API_PREFIX = '/api/v1'

// Una dirección con esquema (`https:`) o con `//` delante ya trae su propio origen.
const SCHEME = /^[a-z][a-z\d+.-]*:/iu

function hasOrigin(path: string): boolean {
  return path.startsWith('//') || SCHEME.test(path)
}

// En desarrollo `VITE_API_URL` queda vacía y las peticiones salen al mismo
// origen, donde el proxy de Vite las reenvía al backend. En producción es el
// origen del backend, que vive en otro dominio.
const api = { origin: (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/u, '') }

/** Apunta el cliente a otro origen (el servidor simulado del contrato). */
export function setApiOrigin(origin: string): void {
  api.origin = origin.replace(/\/$/u, '')
}

// Sin navegador (las pruebas) no hay origen de la página: se usa uno fijo.
function pageOrigin(): string {
  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin
}

/** El origen del API; el de la página cuando es el mismo. */
export function apiOrigin(): string {
  return api.origin === '' ? pageOrigin() : api.origin
}

/** La dirección de una ruta del API (`/events`), relativa a `/api/v1`. */
export function apiUrl(path: string): string {
  return `${api.origin}${API_PREFIX}${path}`
}

/** Lo que decide adónde va una petición: su ruta relativa a `/api/v1` o una dirección completa. */
type RequestTarget = string | undefined

function urlOf(target: RequestTarget): URL | null {
  const path = target ?? ''
  const joined = hasOrigin(path) ? path : `${apiUrl('')}/${path.replace(/^\/+/u, '')}`
  try {
    // `URL` resuelve los `..` y una ruta sin barra inicial.
    return new URL(joined, pageOrigin())
  } catch {
    return null
  }
}

/**
 * Si la petición va al API de la aplicación, mirando la dirección final y no
 * el texto de la ruta: una dirección de otro origen (`https://otro.com/…`,
 * `//otro.com/…`) no es del API.
 */
function isApiTarget(target: RequestTarget): boolean {
  const base = urlOf('')
  const url = base === null ? null : urlOf(target)
  return base !== null && url?.origin === base.origin
}

/**
 * El token que acompaña a una petición: el de la sesión abierta si va al API,
 * y ninguno si va a otro origen. Cuál ruta acepta qué cuenta lo decide el
 * servidor con sus permisos; el cliente solo no reparte la credencial fuera.
 */
export function tokenFor(target: RequestTarget, token: string | null): string | null {
  return isApiTarget(target) ? token : null
}
