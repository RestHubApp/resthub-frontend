// A qué sesión pertenece una petición y dónde está el API.
//
// Cada sesión viaja solo a sus rutas, y esto se decide mirando la dirección
// final y no el texto de la ruta.

const API_PREFIX = '/api/v1'

/** El prefijo de las rutas del administrador del sistema, relativo a `/api/v1`. */
const PLATFORM_PREFIX = '/platform'

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

type Destination = 'restaurant' | 'platform' | 'foreign'

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
 * A quién pertenece la petición, mirando la dirección final y no el texto de
 * la ruta: `platform/x` sin barra es de plataforma, `/platform/../orders` no,
 * y una dirección de otro origen (`https://otro.com/…`, `//otro.com/…`) no
 * es de ninguna sesión.
 */
function destinationOf(target: RequestTarget): Destination {
  const base = urlOf('')
  const url = base === null ? null : urlOf(target)
  if (base === null || url?.origin !== base.origin) {
    return 'foreign'
  }
  const platformPath = `${base.pathname.replace(/\/$/u, '')}${PLATFORM_PREFIX}`
  return url.pathname === platformPath || url.pathname.startsWith(`${platformPath}/`) ? 'platform' : 'restaurant'
}

/**
 * Si una petición es del administrador del sistema.
 *
 * Solo cuenta el prefijo completo: `/platformas` o `/restaurant/platform` no
 * lo son. La consulta (`?search=`) no cambia a quien pertenece la ruta.
 */
export function isPlatformPath(target: RequestTarget): boolean {
  return destinationOf(target) === 'platform'
}

/** Los tokens abiertos en este momento, por sesión. */
export interface SessionTokens {
  readonly restaurant: string | null
  readonly platform: string | null
}

/**
 * El token que acompaña a una petición.
 *
 * Cada sesión viaja solo a sus rutas: el token de plataforma nunca sale hacia
 * un endpoint de restaurante ni el de restaurante hacia `/platform/*`. El
 * servidor rechazaría la mezcla con 401, pero además no tiene por qué verla.
 * Una petición a otro origen que el del API no lleva ninguno.
 */
export function tokenFor(target: RequestTarget, tokens: SessionTokens): string | null {
  switch (destinationOf(target)) {
    case 'platform': {
      return tokens.platform
    }
    case 'restaurant': {
      return tokens.restaurant
    }
    case 'foreign': {
      return null
    }
  }
}
