import { create } from 'zustand'

import { setAuthToken, setUnauthorizedHandler } from '../services/api'
import { DEFAULT_TIME_ZONE } from '../services/format'
import { logger } from '../services/logger'
import { expiryTimer, isTokenExpired } from '../services/tokenExpiry'
import { clearQueriesExcept, PLATFORM_QUERY_ROOT } from '../services/queryClient'
import type { CurrentUserResponse, PermissionCode } from '../api/types'

// La version va en la clave: si cambia la forma de lo guardado, una sesion
// vieja se descarta en vez de leerse como si tuviera la forma nueva.
const STORAGE_KEY = 'resthub.session.v2'
// Las versiones anteriores ya no se leen; tampoco se dejan con un token adentro.
const OLD_STORAGE_KEYS = ['resthub.session.v1'] as const

interface StoredSession {
  token: string
  account: CurrentUserResponse
}

interface SessionState {
  token: string | null
  /** La cuenta, su restaurante y sus permisos, tal como los da `GET /auth/me`. */
  account: CurrentUserResponse | null
  /** La sesion se cerro sola porque el token vencio: el acceso lo explica. */
  expired: boolean
  signIn: (token: string, account: CurrentUserResponse) => void
  /** Aplica una lectura nueva de `GET /auth/me`: nombre, restaurante o permisos. */
  refresh: (account: CurrentUserResponse) => void
  /**
   * Cambia el token `origin` por uno renovado sin cerrar la sesion. Si la
   * sesion ya no es la de `origin` (se cerro o entro otra cuenta mientras
   * viajaba la renovacion), la respuesta se descarta.
   */
  renew: (origin: string, token: string, account: CurrentUserResponse) => void
  signOut: () => void
  /** Cierra la sesion porque el servidor ya no acepta el token. */
  expire: () => void
}

/**
 * Lee la sesion guardada del navegador.
 *
 * El token vive en `localStorage` para que recargar la pagina no eche al
 * usuario. Cualquier lectura puede fallar en una ventana privada o con el
 * almacenamiento bloqueado, asi que el fallo se trata como "no hay sesion".
 */
function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : (JSON.parse(raw) as StoredSession)
  } catch {
    return null
  }
}

function forgetOldSessions(): void {
  try {
    for (const key of OLD_STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // Sin almacenamiento tampoco hay nada viejo que borrar.
  }
}

function writeStoredSession(session: StoredSession | null): void {
  try {
    if (session === null) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Sin almacenamiento la sesion dura lo que dure la pestana. Es una
    // degradacion aceptable; perder el acceso por no poder escribir no lo es.
  }
}

// Cierra la sesion en el momento en que vence su token.
const programarVencimiento = expiryTimer(() => {
  useSession.getState().expire()
})

function limpiarSesion(): void {
  setAuthToken(null)
  writeStoredSession(null)
  programarVencimiento(null)
  // Nada de la cuenta anterior queda en el cache para la siguiente. Lo del
  // administrador del sistema es de otra sesion y se queda.
  clearQueriesExcept(PLATFORM_QUERY_ROOT)
}

forgetOldSessions()
const guardada = readStoredSession()
const restored = guardada !== null && !isTokenExpired(guardada.token) ? guardada : null
if (guardada !== null && restored === null) {
  writeStoredSession(null)
}
setAuthToken(restored?.token ?? null)

export const useSession = create<SessionState>((set, get) => ({
  token: restored?.token ?? null,
  account: restored?.account ?? null,
  expired: guardada !== null && restored === null,

  signIn: (token, account) => {
    setAuthToken(token)
    writeStoredSession({ token, account })
    set({ token, account, expired: false })
    programarVencimiento(token)
    logger.info(
      { userId: account.user.id, roleId: account.user.role_id, restaurantId: account.restaurant.id },
      'auth.signed_in',
    )
  },

  refresh: (account) => {
    const token = get().token
    if (token === null) {
      return
    }
    writeStoredSession({ token, account })
    set({ account })
  },

  renew: (origin, token, account) => {
    if (get().token !== origin) {
      return
    }
    setAuthToken(token)
    writeStoredSession({ token, account })
    set({ token, account })
    programarVencimiento(token)
    logger.info('auth.renewed')
  },

  signOut: () => {
    limpiarSesion()
    set({ token: null, account: null, expired: false })
    logger.info('auth.signed_out')
  },

  expire: () => {
    if (get().token === null) {
      return
    }
    limpiarSesion()
    set({ token: null, account: null, expired: true })
    logger.warn('auth.session_expired')
  },
}))

programarVencimiento(restored?.token ?? null)
setUnauthorizedHandler(() => {
  useSession.getState().expire()
})

export function hasPermission(
  account: CurrentUserResponse | null,
  permission: PermissionCode,
): boolean {
  return account?.permissions.includes(permission) ?? false
}

/**
 * Si la cuenta puede hacer algo, segun los permisos de su rol.
 *
 * Ocultar un boton es comodidad, no seguridad: el servidor vuelve a comprobar
 * el permiso en cada peticion. La interfaz pregunta por permisos y no por
 * roles para que cambiar el mapa de permisos de un rol en el backend se
 * refleje sin tocar ninguna pantalla.
 */
export function useCan(permission: PermissionCode): boolean {
  return useSession((state) => hasPermission(state.account, permission))
}

const SIN_PERMISOS: readonly PermissionCode[] = []

/**
 * Todos los permisos de la cuenta.
 *
 * Para comparar con los de un rol: nadie da un permiso que no tiene.
 */
export function usePermissions(): readonly PermissionCode[] {
  return useSession((state) => state.account?.permissions ?? SIN_PERMISOS)
}

/**
 * `useCan` fuera de un componente, con la sesión de este momento.
 *
 * Lo usan las precargas: pedir por adelantado algo que el servidor va a
 * rechazar con 403 solo gasta un viaje de red.
 */
export function can(permission: PermissionCode): boolean {
  return hasPermission(useSession.getState().account, permission)
}

/** La zona horaria del restaurante fuera de un componente. */
export function currentTimeZone(): string {
  return useSession.getState().account?.restaurant.timezone ?? DEFAULT_TIME_ZONE
}

/**
 * La zona horaria del restaurante (`America/Lima`). "Hoy" y las horas de los
 * pedidos son las del local, no las del navegador de quien mira.
 */
export function useTimeZone(): string {
  return useSession((state) => state.account?.restaurant.timezone ?? DEFAULT_TIME_ZONE)
}
