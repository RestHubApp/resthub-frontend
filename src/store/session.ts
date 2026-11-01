import { create } from 'zustand'

import { setAuthToken, setCookieSession, setLockHandler, setUnauthorizedHandler } from '@/services/apiCredentials'
import { DEFAULT_TIME_ZONE } from '@/services/format'
import { logger } from '@/services/logger'
import { expiryTimer } from '@/services/tokenExpiry'
import { clearQueries } from '@/services/queryClient'
import { isPreviewTab, setPreviewTabMark } from '@/services/tabStorage'
import { discardPreviewQueue } from './offlineQueue'
import { adoptRecord, canAdoptStoredSession, isCurrent, logSignedIn, noteExpiry, opened, openRecord, otherTabChange, recordOf } from './sessionRecord'
import { forgetOldSessions, persistence, readSaved, STORAGE, STORAGE_KEY, writeStoredSession } from './sessionStorageAccess'
import type { AnyPermissionCode, PermissionCode, Session, StaffSession } from '@/api/types'

interface SessionState {
  /**
   * El token de esta pestaña, solo en memoria (S2). Tras recargar la página
   * falta hasta recuperarlo de la cookie del API; mientras, las peticiones
   * viajan con la cookie.
   */
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
   * viajaba la renovacion), la respuesta se descarta. Con `origin` en `null`
   * es el token recuperado de la cookie tras recargar.
   */
  renew: (origin: string | null, token: string, account: Session) => void
  signOut: () => void
  /** Cierra la sesion porque el servidor ya no la acepta. */
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

// Cierra la sesion en el momento en que vence su token.
const scheduleExpiry = expiryTimer(() => {
  rejectCredential(useSession.getState().token)
})

function cleanSession(): void {
  setAuthToken(null)
  setCookieSession(false)
  writeStoredSession(null)
  adoptRecord(null)
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
  setCookieSession(false)
  persistence.tag = null
  adoptRecord(null)
  scheduleExpiry(null)
  clearQueries()
}

forgetOldSessions()
const initialRead = readSaved()
const saved = initialRead.ok ? initialRead.session : null
const restored = isCurrent(saved) ? saved : null
if (saved !== null && restored === null) {
  writeStoredSession(null)
}
persistence.tag = restored?.tag ?? null
adoptRecord(restored)
// Una vista previa que se recarga ya vencida tampoco guarda su cola.
if (restored === null) {
  discardPreviewQueue()
}
setAuthToken(restored?.token ?? null)
setCookieSession(restored !== null && !isPreviewTab())

/** Guarda el token en memoria y la sesión en el navegador, y programa su vencimiento. */
function keepToken(token: string, account: Session): void {
  setAuthToken(token)
  const expiry = noteExpiry(token)
  writeStoredSession(recordOf(account, token))
  scheduleExpiry(expiry)
}

/** Aplica una lectura nueva de `GET /auth/me` sin tocar el token. */
function refreshSession(account: Session): void {
  const { token, account: actual } = useSession.getState()
  if (actual === null) {
    return
  }
  if (otherTabChange()) {
    syncWithStoredSession()
    return
  }
  writeStoredSession(recordOf(account, token))
  useSession.setState({ account })
}

/** Cambia el token `origin` por el renovado, salvo que la sesión ya no sea la de `origin`. */
function renewSession(origin: string | null, token: string, account: Session): void {
  const state = useSession.getState()
  if (state.token !== origin || state.account === null) {
    return
  }
  // Otra pestana cerro la sesion o entro otra cuenta mientras esta renovaba:
  // escribir el token renovado resucitaria la sesion cerrada o pisaria la
  // de la otra cuenta. Esta pestana se pone al dia con lo guardado.
  if (otherTabChange()) {
    syncWithStoredSession()
    return
  }
  keepToken(token, account)
  useSession.setState({ token, account })
  logger.info('auth.renewed')
}

/**
 * El servidor rechazó la sesión (401) o venció el token `used`. Si ya no es el
 * de esta pestaña (se renovó mientras tanto), no cambia nada. Si lo era y la
 * sesión sigue en la cookie (otra pestaña la renovó o cambió la contraseña,
 * y eso cortó este token), la pestaña lo suelta y la recupera de ahí. Sin
 * token que soltar (ya se probó la cookie) o en una vista previa, la cierra.
 */
function rejectCredential(used: string | null): void {
  const { token } = useSession.getState()
  if (used !== null && used !== token) {
    return
  }
  if (used === null || isPreviewTab()) {
    useSession.getState().expire()
    return
  }
  setAuthToken(null)
  scheduleExpiry(null)
  useSession.setState({ token: null })
  logger.info('auth.token_dropped')
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

export const useSession = create<SessionState>((set, get) => ({
  token: restored?.token ?? null,
  account: restored?.account ?? null,
  expired: saved !== null && restored === null,
  passwordChanged: false,

  signIn: (token, account) => {
    openRecord()
    setCookieSession(!account.preview)
    keepToken(token, account)
    set({ token, account, expired: false, passwordChanged: false })
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
    if (get().account === null) {
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

scheduleExpiry(restored?.expiresAt ?? null)
setUnauthorizedHandler(rejectCredential)
setLockHandler(() => {
  useSession.getState().setLocked(true)
})

/**
 * Pone esta pestana al dia con la sesion guardada en el navegador, que otra
 * pestana (o la ventana de la PWA) acaba de cambiar.
 *
 * - La misma cuenta que volvio a entrar en otra pestana, o una sesion nueva
 *   cuando esta pestana no tenia ninguna: se adopta. Esta pestana sigue con
 *   su token, o recupera uno de la cookie si no tenia.
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
  if (actual !== null && actual.tag === opened.tag) {
    return
  }
  if (canAdoptStoredSession(actual, status.account)) {
    persistence.tag = actual.tag
    adoptRecord(actual)
    setCookieSession(true)
    scheduleExpiry(actual.expiresAt)
    useSession.setState({ account: actual.account, expired: false, passwordChanged: false })
    logger.info('auth.synced_from_other_tab')
    return
  }
  if (status.account === null) {
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

/**
 * Deja en la sesión el token que el servidor dio al cambiarle el identificador
 * (al confirmar la contraseña o desbloquear, ASVS V7.2.4): la cuenta es la misma
 * y el token anterior ya no vale. `null` (no hubo cambio) no toca nada.
 */
export function adoptRotatedToken(token: string | null): void {
  const { token: origin, account, renew } = useSession.getState()
  if (token === null || account === null) {
    return
  }
  renew(origin, token, account)
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
