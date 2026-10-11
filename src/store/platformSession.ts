import { create } from 'zustand'

import type { PlatformAdmin } from '@/api/types'
import { setPlatformAuthToken, setPlatformUnauthorizedHandler } from '@/services/apiCredentials'
import { logger } from '@/services/logger'
import { clearQueriesOf, PLATFORM_QUERY_ROOT } from '@/services/queryClient'
import { isPreviewTab } from '@/services/tabStorage'
import { expiryTimer, isTokenExpired } from '@/services/tokenExpiry'

// La sesión del administrador del sistema. Es otra sesión, no un rol: vive en
// su propia clave, con su propio token, y abrirla o cerrarla no toca la del
// restaurante que pueda estar abierta en el mismo navegador.
export const PLATFORM_STORAGE_KEY = 'resthub.platform-session.v1'

interface StoredPlatformSession {
  token: string
  admin: PlatformAdmin
}

interface PlatformSessionState {
  token: string | null
  admin: PlatformAdmin | null
  /** La sesión se cerró sola porque el token venció: el acceso lo explica. */
  expired: boolean
  signIn: (token: string, admin: PlatformAdmin) => void
  /** Aplica una lectura nueva de `GET /platform/auth/me`. */
  refresh: (admin: PlatformAdmin) => void
  /**
   * Cambia el token `origin` por uno renovado sin cerrar la sesión. Si la
   * sesión ya no es la de `origin` (se cerró o entró otra cuenta mientras
   * viajaba la renovación), la respuesta se descarta.
   */
  renew: (origin: string, token: string, admin: PlatformAdmin) => void
  signOut: () => void
  /** Cierra la sesión porque el servidor ya no acepta el token. */
  expire: () => void
}

// Una pestaña de vista previa no lee ni escribe la sesión de plataforma del
// navegador: vive solo en su memoria (y el área de plataforma no se muestra
// ahí). Si no, un 401 o un «Salir» en esa pestaña cerraría la sesión real del
// administrador en todas las demás.
function getStorage(): Storage | null {
  return isPreviewTab() ? null : localStorage
}

// Una lectura o escritura puede fallar en una ventana privada o con el
// almacenamiento bloqueado: se trata como «no hay sesión guardada».
function readStored(): StoredPlatformSession | null {
  const read = readStoredResult()
  return read.ok ? read.session : null
}

type Read = { readonly ok: true; readonly session: StoredPlatformSession | null } | { readonly ok: false }

// Distingue «no hay sesión guardada» de «no se pudo leer»: sin almacenamiento
// no se sabe qué hizo otra pestaña, y eso no alcanza para cerrar esta.
function readStoredResult(): Read {
  try {
    const storage = getStorage()
    if (storage === null) {
      return { ok: false }
    }
    const raw = storage.getItem(PLATFORM_STORAGE_KEY)
    return { ok: true, session: raw === null ? null : (JSON.parse(raw) as StoredPlatformSession) }
  } catch {
    return { ok: false }
  }
}

// El token que esta pestaña logró guardar (o restauró). Solo se compara lo
// guardado con lo que esta pestaña escribió.
const persistence: { token: string | null } = { token: null }

function writeStored(session: StoredPlatformSession | null): void {
  persistence.token = null
  try {
    const storage = getStorage()
    if (session === null) {
      storage?.removeItem(PLATFORM_STORAGE_KEY)
      return
    }
    storage?.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(session))
    persistence.token = storage === null ? null : session.token
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la pestaña.
  }
}

/**
 * Si otra pestaña cambió la sesión guardada después de que esta guardó
 * `token` (la cerró, entró otro administrador o ya la renovó): esta no debe
 * escribir encima.
 */
function otherTabChange(token: string): boolean {
  // Compara tokens para saber cuál sesión escribió esta pestaña, no para verificar un secreto.
  const wasWrittenByThis = persistence.token === token
  if (!wasWrittenByThis) {
    return false
  }
  const read = readStoredResult()
  return read.ok && read.session?.token !== token
}

const scheduleExpiry = expiryTimer(() => {
  usePlatformSession.getState().expire()
})

function clean(): void {
  setPlatformAuthToken(null)
  writeStored(null)
  scheduleExpiry(null)
  // Solo lo de plataforma, consultas y mutaciones (con las contraseñas de los
  // encargados dados de alta): lo del restaurante es de otra sesión.
  clearQueriesOf(PLATFORM_QUERY_ROOT)
}

/** Cierra la sesión solo en esta pestaña, sin tocar lo guardado, que ya es de otra. */
function drop(): void {
  setPlatformAuthToken(null)
  persistence.token = null
  scheduleExpiry(null)
  clearQueriesOf(PLATFORM_QUERY_ROOT)
}

function open(token: string, admin: PlatformAdmin): void {
  setPlatformAuthToken(token)
  writeStored({ token, admin })
  scheduleExpiry(token)
}

const saved = readStored()
const restored = saved !== null && !isTokenExpired(saved.token) ? saved : null
if (saved !== null && restored === null) {
  writeStored(null)
}
persistence.token = restored?.token ?? null
setPlatformAuthToken(restored?.token ?? null)

export const usePlatformSession = create<PlatformSessionState>((set, get) => ({
  token: restored?.token ?? null,
  admin: restored?.admin ?? null,
  expired: saved !== null && restored === null,

  signIn: (token, admin) => {
    open(token, admin)
    set({ token, admin, expired: false })
    logger.info({ adminId: admin.id }, 'platform.signed_in')
  },

  refresh: (admin) => {
    const token = get().token
    // eslint-disable-next-line security/detect-possible-timing-attacks -- compara con null, no con un secreto: el cliente no verifica credenciales
    if (token === null) {
      return
    }
    if (otherTabChange(token)) {
      syncWithStoredPlatformSession()
      return
    }
    writeStored({ token, admin })
    set({ admin })
  },

  renew: (origin, token, admin) => {
    if (get().token !== origin) {
      return
    }
    // Otra pestaña cerró la sesión o entró otro administrador mientras esta
    // renovaba: escribir encima la resucitaría o pisaría la del otro.
    if (otherTabChange(origin)) {
      syncWithStoredPlatformSession()
      return
    }
    open(token, admin)
    set({ token, admin })
    logger.info('platform.renewed')
  },

  signOut: () => {
    clean()
    set({ token: null, admin: null, expired: false })
    logger.info('platform.signed_out')
  },

  expire: () => {
    if (get().token === null) {
      return
    }
    clean()
    set({ token: null, admin: null, expired: true })
    logger.warn('platform.session_expired')
  },
}))

scheduleExpiry(restored?.token ?? null)
setPlatformUnauthorizedHandler(() => {
  usePlatformSession.getState().expire()
})

/** Si lo guardado sigue vigente y es del mismo administrador (o esta pestaña no tenía ninguno). */
function canAdoptStoredPlatformSession(
  stored: StoredPlatformSession | null,
  admin: PlatformAdmin | null,
): stored is StoredPlatformSession {
  if (stored === null || isTokenExpired(stored.token)) {
    return false
  }
  return admin === null || admin.id === stored.admin.id
}

/**
 * Pone esta pestaña al día con la sesión de plataforma guardada, que otra
 * pestaña acaba de cambiar: adopta la del mismo administrador (renovada) o una
 * nueva si esta no tenía ninguna; si ya no hay sesión, venció o es de otro
 * administrador, cierra la de esta pestaña sin borrar lo guardado. Una pestaña
 * de vista previa no guarda la sesión de plataforma y no se sincroniza.
 */
function syncWithStoredPlatformSession(): void {
  const read = readStoredResult()
  if (!read.ok) {
    return
  }
  const actual = read.session
  const status = usePlatformSession.getState()
  if (actual !== null && actual.token === status.token) {
    return
  }
  if (canAdoptStoredPlatformSession(actual, status.admin)) {
    setPlatformAuthToken(actual.token)
    persistence.token = actual.token
    scheduleExpiry(actual.token)
    usePlatformSession.setState({ token: actual.token, admin: actual.admin, expired: false })
    logger.info('platform.synced_from_other_tab')
    return
  }
  if (status.token === null) {
    return
  }
  drop()
  usePlatformSession.setState({ token: null, admin: null, expired: false })
  logger.info('platform.signed_out_in_other_tab')
}

// El navegador avisa a las demás pestañas cuando una cambia `localStorage`.
// `key === null` es que se vació el almacenamiento entero.
if (typeof window !== 'undefined' && !isPreviewTab()) {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.storageArea !== null && event.storageArea !== getStorage()) {
      return
    }
    if (event.key === PLATFORM_STORAGE_KEY || event.key === null) {
      syncWithStoredPlatformSession()
    }
  })
}
