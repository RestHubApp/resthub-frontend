import { create } from 'zustand'

import { setAuthToken, setLockHandler, setUnauthorizedHandler } from '@/services/apiCredentials'
import { DEFAULT_TIME_ZONE } from '@/services/format'
import { logger } from '@/services/logger'
import { expiryTimer, isTokenExpired } from '@/services/tokenExpiry'
import { clearQueries } from '@/services/queryClient'
import { isPreviewTab, setPreviewTabMark } from '@/services/tabStorage'
import { discardPreviewQueue } from './offlineQueue'
import {
  forgetOldSessions,
  persistence,
  readSaved,
  STORAGE,
  STORAGE_KEY,
  type StoredSession,
  writeStoredSession,
} from './sessionStorageAccess'
import type { AnyPermissionCode, PermissionCode, Session, StaffSession } from '@/api/types'

interface SessionState {
  token: string | null
  /**
   * La sesión tal como la da `GET /auth/me`: la del personal de un restaurante
   * o la de la administración del sistema, según `kind`.
   */
  account: Session | null
  /** La sesion se cerro sola porque el token vencio: el acceso lo explica. */
  expired: boolean
  /** La sesion se cerro porque no se pudo seguir tras cambiar la contraseña: el acceso lo explica. */
  passwordChanged: boolean
  signIn: (token: string, account: Session) => void
  /** Aplica una lectura nueva de `GET /auth/me`: nombre, restaurante o permisos. */
  refresh: (account: Session) => void
  /**
   * Cambia el token `origin` por uno renovado sin cerrar la sesion. Si la
   * sesion ya no es la de `origin` (se cerro o entro otra cuenta mientras
   * viajaba la renovacion), la respuesta se descarta.
   */
  renew: (origin: string, token: string, account: Session) => void
  signOut: () => void
  /** Cierra la sesion porque el servidor ya no acepta el token. */
  expire: () => void
  /**
   * Bloquea o desbloquea la sesión del personal por inactividad (RFS-29). El
   * servidor es quien bloquea de verdad (423); esto solo decide qué se muestra.
   */
  setLocked: (isLocked: boolean) => void
  /**
   * Cierra la sesion despues de cambiar la contraseña propia cuando no se pudo
   * seguir con el token nuevo: el servidor ya revoco el que habia y usarlo solo
   * daria 401.
   */
  signOutAfterPasswordChange: () => void
  /**
   * Abre la sesion de vista previa que entrego `POST /auth/preview`.
   *
   * Solo en una pestana de vista previa y solo con una sesion que el servidor
   * marco `preview: true`: asi nunca termina en `localStorage`.
   */
  startPreview: (token: string, account: StaffSession) => void
  /**
   * Sale de la vista previa: borra su sesion y deja de tratar la pestana como
   * de vista previa. En una pestana normal no hace nada.
   */
  exitPreview: () => void
}

/**
 * Si otra pestana cambio la sesion guardada despues de que esta guardo `token`:
 * la cerro, entro otra cuenta o ya la renovo. Entonces esta pestana no debe
 * escribir encima; lo guardado manda. Una vista previa vive en su propia
 * pestana y ninguna otra la toca.
 */
function otherTabChange(token: string): boolean {
  // Compara tokens para saber cuál sesión escribió esta pestaña, no para verificar un secreto.
  const wasWrittenByThis = persistence.token === token
  if (isPreviewTab() || !wasWrittenByThis) {
    return false
  }
  const read = readSaved()
  return read.ok && read.session?.token !== token
}

// Cierra la sesion en el momento en que vence su token.
const scheduleExpiry = expiryTimer(() => {
  useSession.getState().expire()
})

function cleanSession(): void {
  setAuthToken(null)
  writeStoredSession(null)
  scheduleExpiry(null)
  // Nada de la cuenta anterior queda en el cache para la siguiente.
  clearQueries()
  // En una vista previa, al salir o vencer, su cola (solo de esta pestana y
  // del local de muestra) ya no tiene con que enviarse. En una normal no hace nada.
  discardPreviewQueue()
}

/**
 * Cierra la sesion solo en esta pestana, sin tocar lo guardado: lo guardado ya
 * es de otra pestana (que la cerro o abrio otra cuenta) y borrarlo la echaria.
 */
function dropSession(): void {
  setAuthToken(null)
  persistence.token = null
  scheduleExpiry(null)
  clearQueries()
}

/** Si lo guardado se puede seguir usando: vigente y, en una vista previa, marcado como tal. */
function current(session: StoredSession | null): session is StoredSession {
  return session !== null && !isTokenExpired(session.token) && (!isPreviewTab() || session.account.preview)
}

forgetOldSessions()
const initialRead = readSaved()
const saved = initialRead.ok ? initialRead.session : null
const restored = current(saved) ? saved : null
if (saved !== null && restored === null) {
  writeStoredSession(null)
}
persistence.token = restored?.token ?? null
// Una vista previa que se recarga ya vencida tampoco guarda su cola.
if (restored === null) {
  discardPreviewQueue()
}
setAuthToken(restored?.token ?? null)

/** Aplica una lectura nueva de `GET /auth/me` sin tocar el token. */
function refreshSession(account: Session): void {
  const { token } = useSession.getState()
  // eslint-disable-next-line security/detect-possible-timing-attacks -- compara con null, no con un secreto: el cliente no verifica credenciales
  if (token === null) {
    return
  }
  if (otherTabChange(token)) {
    syncWithStoredSession()
    return
  }
  writeStoredSession({ token, account })
  useSession.setState({ account })
}

/** Cambia el token `origin` por el renovado, salvo que la sesión ya no sea la de `origin`. */
function renewSession(origin: string, token: string, account: Session): void {
  if (useSession.getState().token !== origin) {
    return
  }
  // Otra pestana cerro la sesion o entro otra cuenta mientras esta renovaba:
  // escribir el token renovado resucitaria la sesion cerrada o pisaria la
  // de la otra cuenta. Esta pestana se pone al dia con lo guardado.
  if (otherTabChange(origin)) {
    syncWithStoredSession()
    return
  }
  setAuthToken(token)
  writeStoredSession({ token, account })
  useSession.setState({ token, account })
  scheduleExpiry(token)
  logger.info('auth.renewed')
}

/** Abre la sesión de vista previa, solo en su propia pestaña y con una cuenta `preview`. */
function startPreviewSession(token: string, account: StaffSession): void {
  if (!isPreviewTab() || !account.preview) {
    throw new Error('Una sesion de vista previa solo se abre en su propia pestana.')
  }
  // Lo que esta pestana haya cargado antes no se mezcla con el local de muestra.
  clearQueries()
  setPreviewTabMark(true)
  useSession.getState().signIn(token, account)
  logger.info({ restaurantId: account.restaurant.id }, 'auth.preview_started')
}

/** Sale de la vista previa; en una pestaña normal no hace nada. */
function exitPreviewSession(): void {
  if (!isPreviewTab()) {
    return
  }
  cleanSession()
  setPreviewTabMark(false)
  useSession.setState({ token: null, account: null, expired: false, passwordChanged: false })
  logger.info('auth.preview_exited')
}

function logSignedIn(account: Session): void {
  if (account.kind === 'platform') {
    logger.info({ adminId: account.admin.id }, 'auth.signed_in')
    return
  }
  logger.info({ userId: account.user.id, roleId: account.user.role_id, restaurantId: account.restaurant.id }, 'auth.signed_in')
}

export const useSession = create<SessionState>((set, get) => ({
  token: restored?.token ?? null,
  account: restored?.account ?? null,
  expired: saved !== null && restored === null,
  passwordChanged: false,

  signIn: (token, account) => {
    setAuthToken(token)
    writeStoredSession({ token, account })
    set({ token, account, expired: false, passwordChanged: false })
    scheduleExpiry(token)
    logSignedIn(account)
  },

  signOut: () => {
    cleanSession()
    set({ token: null, account: null, expired: false, passwordChanged: false })
    logger.info('auth.signed_out')
  },

  refresh: refreshSession,
  renew: renewSession,
  startPreview: startPreviewSession,
  exitPreview: exitPreviewSession,

  signOutAfterPasswordChange: () => {
    get().signOut()
    set({ passwordChanged: true })
  },

  expire: () => {
    if (get().token === null) {
      return
    }
    cleanSession()
    set({ token: null, account: null, expired: true, passwordChanged: false })
    logger.warn('auth.session_expired')
  },

  setLocked: (isLocked) => {
    const account = staffOf(get().account)
    if (account === null || account.session_locked === isLocked) return
    refreshSession({ ...account, session_locked: isLocked })
    logger.info(isLocked ? 'auth.session_locked' : 'auth.session_unlocked')
  },

}))

scheduleExpiry(restored?.token ?? null)
setUnauthorizedHandler(() => {
  useSession.getState().expire()
})
setLockHandler(() => {
  useSession.getState().setLocked(true)
})

function accountId(account: Session): number {
  return account.kind === 'platform' ? account.admin.id : account.user.id
}

/** Si la sesión guardada es de la misma cuenta (y, en el personal, del mismo local) que esta pestaña. */
function isSameAccount(stored: StoredSession, account: Session): boolean {
  if (stored.account.kind === 'platform' || account.kind === 'platform') {
    return stored.account.kind === account.kind && accountId(stored.account) === accountId(account)
  }
  return accountId(stored.account) === accountId(account) && stored.account.restaurant.id === account.restaurant.id
}

/** Si lo guardado se puede adoptar: sigue vigente y es de la misma cuenta (o esta pestaña no tenía ninguna). */
function canAdoptStoredSession(stored: StoredSession | null, account: Session | null): stored is StoredSession {
  return current(stored) && (account === null || isSameAccount(stored, account))
}

/**
 * Pone esta pestana al dia con la sesion guardada en el navegador, que otra
 * pestana (o la ventana de la PWA) acaba de cambiar.
 *
 * - La misma cuenta con otro token (otra pestana la renovo o releyo sus
 *   permisos), o una sesion nueva cuando esta pestana no tenia ninguna: se adopta.
 * - Nada guardado, una sesion vencida u otra cuenta: esta pestana cierra la
 *   suya sin borrar lo guardado. Seguir con la cuenta anterior dejaria a quien
 *   usa el celular despues operando con la identidad de otro.
 *
 * Una pestana de vista previa guarda su sesion en su propio `sessionStorage`
 * y no se sincroniza con nadie.
 */
function syncWithStoredSession(): void {
  if (isPreviewTab()) {
    return
  }
  const read = readSaved()
  if (!read.ok) {
    return
  }
  const actual = read.session
  const status = useSession.getState()
  if (actual !== null && actual.token === status.token) {
    return
  }
  if (canAdoptStoredSession(actual, status.account)) {
    setAuthToken(actual.token)
    persistence.token = actual.token
    scheduleExpiry(actual.token)
    useSession.setState({ token: actual.token, account: actual.account, expired: false, passwordChanged: false })
    logger.info('auth.synced_from_other_tab')
    return
  }
  if (status.token === null) {
    return
  }
  dropSession()
  useSession.setState({ token: null, account: null, expired: false, passwordChanged: false })
  logger.info('auth.signed_out_in_other_tab')
}

// El navegador avisa a las demas pestanas del mismo origen cuando una cambia
// `localStorage`; la que lo cambio no recibe el aviso. `key === null` es que
// se vacio el almacenamiento entero.
if (typeof window !== 'undefined' && !isPreviewTab()) {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.storageArea !== null && event.storageArea !== STORAGE) {
      return
    }
    if (event.key === STORAGE_KEY || event.key === null) {
      syncWithStoredSession()
    }
  })
}

/** Si la sesion abierta es una vista previa del local de muestra, segun el servidor. */
export function usePreview(): boolean {
  return useSession((state) => state.account?.preview === true)
}

const WITHOUT_PERMISSIONS: readonly PermissionCode[] = []

export function hasPermission(account: Session | null, permission: AnyPermissionCode): boolean {
  const granted: readonly AnyPermissionCode[] = account?.permissions ?? WITHOUT_PERMISSIONS
  return granted.includes(permission)
}

/**
 * Si la cuenta puede hacer algo, segun sus permisos (los de su rol, o los
 * `platform.*` de la administración del sistema).
 *
 * Ocultar un boton es comodidad, no seguridad: el servidor vuelve a comprobar
 * el permiso en cada peticion. La interfaz pregunta por permisos y no por
 * roles para que cambiar el mapa de permisos de un rol en el backend se
 * refleje sin tocar ninguna pantalla.
 */
export function useCan(permission: AnyPermissionCode): boolean {
  return useSession((state) => hasPermission(state.account, permission))
}

/** La sesión del personal, o `null` si no hay sesión o es de la administración del sistema. */
export function staffOf(account: Session | null): StaffSession | null {
  return account?.kind === 'staff' ? account : null
}

/** La sesión del personal de este momento; lo propio de un restaurante (pedidos, cola, términos) corre solo con ella. */
export function useStaffAccount(): StaffSession | null {
  return useSession((state) => staffOf(state.account))
}

/**
 * Todos los permisos del restaurante de la cuenta.
 *
 * Para comparar con los de un rol: nadie da un permiso que no tiene. Una
 * cuenta de plataforma no tiene ninguno.
 */
export function usePermissions(): readonly PermissionCode[] {
  return useSession((state) => staffOf(state.account)?.permissions ?? WITHOUT_PERMISSIONS)
}

/**
 * `useCan` fuera de un componente, con la sesión de este momento.
 *
 * Lo usan las precargas: pedir por adelantado algo que el servidor va a
 * rechazar con 403 solo gasta un viaje de red.
 */
export function can(permission: AnyPermissionCode): boolean {
  return hasPermission(useSession.getState().account, permission)
}

/** La zona horaria del restaurante fuera de un componente. */
export function currentTimeZone(): string {
  return staffOf(useSession.getState().account)?.restaurant.timezone ?? DEFAULT_TIME_ZONE
}

/**
 * La zona horaria del restaurante (`America/Lima`). "Hoy" y las horas de los
 * pedidos son las del local, no las del navegador de quien mira.
 */
export function useTimeZone(): string {
  return useSession((state) => staffOf(state.account)?.restaurant.timezone ?? DEFAULT_TIME_ZONE)
}
