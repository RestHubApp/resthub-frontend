import { create } from 'zustand'

import { setAuthToken, setUnauthorizedHandler } from '../services/api'
import { DEFAULT_TIME_ZONE } from '../services/format'
import { logger } from '../services/logger'
import { expiryTimer, isTokenExpired } from '../services/tokenExpiry'
import { clearQueriesExcept, PLATFORM_QUERY_ROOT } from '../services/queryClient'
import { isPreviewTab, setPreviewTabMark, tabStorage } from '../services/tabStorage'
import { discardPreviewQueue } from './offlineQueue'
import type { CurrentUserResponse, PermissionCode } from '../api/types'

// Donde se guarda la sesion lo decide la pestana al cargarse (`tabStorage`):
// `localStorage` en una pestana normal y `sessionStorage` en una de vista
// previa, cada una con su clave. La version va en la clave: si cambia la forma
// de lo guardado, una sesion vieja se descarta en vez de leerse como si tuviera
// la forma nueva.
const ALMACEN = tabStorage.storage
const STORAGE_KEY = tabStorage.sessionKey
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
  /**
   * Abre la sesion de vista previa que entrego `POST /auth/preview`.
   *
   * Solo en una pestana de vista previa y solo con una sesion que el servidor
   * marco `preview: true`: asi nunca termina en `localStorage`.
   */
  startPreview: (token: string, account: CurrentUserResponse) => void
  /**
   * Sale de la vista previa: borra su sesion y deja de tratar la pestana como
   * de vista previa. En una pestana normal no hace nada.
   */
  exitPreview: () => void
}

/**
 * Lee la sesion guardada del navegador.
 *
 * El token se guarda para que recargar la pagina no eche al usuario.
 * Cualquier lectura puede fallar en una ventana privada o con el
 * almacenamiento bloqueado, asi que el fallo se trata como "no hay sesion".
 */
function readStoredSession(): StoredSession | null {
  try {
    const raw = ALMACEN?.getItem(STORAGE_KEY) ?? null
    return raw === null ? null : (JSON.parse(raw) as StoredSession)
  } catch {
    return null
  }
}

function forgetOldSessions(): void {
  // Una pestana de vista previa no toca lo que hay en `localStorage`.
  if (isPreviewTab()) {
    return
  }
  try {
    for (const key of OLD_STORAGE_KEYS) {
      ALMACEN?.removeItem(key)
    }
  } catch {
    // Sin almacenamiento tampoco hay nada viejo que borrar.
  }
}

function writeStoredSession(session: StoredSession | null): void {
  try {
    if (session === null) {
      ALMACEN?.removeItem(STORAGE_KEY)
      return
    }
    ALMACEN?.setItem(STORAGE_KEY, JSON.stringify(session))
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
  // En una vista previa, al salir o vencer, su cola (solo de esta pestana y
  // del local de muestra) ya no tiene con que enviarse. En una normal no hace nada.
  discardPreviewQueue()
}

/** Si lo guardado se puede seguir usando: vigente y, en una vista previa, marcado como tal. */
function vigente(session: StoredSession | null): session is StoredSession {
  return session !== null && !isTokenExpired(session.token) && (!isPreviewTab() || session.account.preview)
}

forgetOldSessions()
const guardada = readStoredSession()
const restored = vigente(guardada) ? guardada : null
if (guardada !== null && restored === null) {
  writeStoredSession(null)
}
// Una vista previa que se recarga ya vencida tampoco guarda su cola.
if (restored === null) {
  discardPreviewQueue()
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

  startPreview: (token, account) => {
    if (!isPreviewTab() || !account.preview) {
      throw new Error('Una sesion de vista previa solo se abre en su propia pestana.')
    }
    // Lo que esta pestana haya cargado antes no se mezcla con el local de muestra.
    clearQueriesExcept(PLATFORM_QUERY_ROOT)
    setPreviewTabMark(true)
    get().signIn(token, account)
    logger.info({ restaurantId: account.restaurant.id }, 'auth.preview_started')
  },

  exitPreview: () => {
    if (!isPreviewTab()) {
      return
    }
    limpiarSesion()
    setPreviewTabMark(false)
    set({ token: null, account: null, expired: false })
    logger.info('auth.preview_exited')
  },
}))

programarVencimiento(restored?.token ?? null)
setUnauthorizedHandler(() => {
  useSession.getState().expire()
})

/** Si la sesion abierta es una vista previa del local de muestra, segun el servidor. */
export function usePreview(): boolean {
  return useSession((state) => state.account?.preview === true)
}

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
