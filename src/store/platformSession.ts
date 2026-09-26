import { create } from 'zustand'

import type { PlatformAdmin } from '../api/types'
import { setPlatformAuthToken, setPlatformUnauthorizedHandler } from '../services/api'
import { logger } from '../services/logger'
import { clearQueriesOf, PLATFORM_QUERY_ROOT } from '../services/queryClient'
import { isPreviewTab } from '../services/tabStorage'
import { expiryTimer, isTokenExpired } from '../services/tokenExpiry'

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
function almacen(): Storage | null {
  return isPreviewTab() ? null : localStorage
}

// Una lectura o escritura puede fallar en una ventana privada o con el
// almacenamiento bloqueado: se trata como «no hay sesión guardada».
function readStored(): StoredPlatformSession | null {
  try {
    const raw = almacen()?.getItem(PLATFORM_STORAGE_KEY) ?? null
    return raw === null ? null : (JSON.parse(raw) as StoredPlatformSession)
  } catch {
    return null
  }
}

function writeStored(session: StoredPlatformSession | null): void {
  try {
    const storage = almacen()
    if (session === null) {
      storage?.removeItem(PLATFORM_STORAGE_KEY)
      return
    }
    storage?.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la pestaña.
  }
}

const programarVencimiento = expiryTimer(() => {
  usePlatformSession.getState().expire()
})

function limpiar(): void {
  setPlatformAuthToken(null)
  writeStored(null)
  programarVencimiento(null)
  // Solo lo de plataforma, consultas y mutaciones (con las contraseñas de los
  // encargados dados de alta): lo del restaurante es de otra sesión.
  clearQueriesOf(PLATFORM_QUERY_ROOT)
}

function abrir(token: string, admin: PlatformAdmin): void {
  setPlatformAuthToken(token)
  writeStored({ token, admin })
  programarVencimiento(token)
}

const guardada = readStored()
const restored = guardada !== null && !isTokenExpired(guardada.token) ? guardada : null
if (guardada !== null && restored === null) {
  writeStored(null)
}
setPlatformAuthToken(restored?.token ?? null)

export const usePlatformSession = create<PlatformSessionState>((set, get) => ({
  token: restored?.token ?? null,
  admin: restored?.admin ?? null,
  expired: guardada !== null && restored === null,

  signIn: (token, admin) => {
    abrir(token, admin)
    set({ token, admin, expired: false })
    logger.info({ adminId: admin.id }, 'platform.signed_in')
  },

  refresh: (admin) => {
    const token = get().token
    if (token === null) {
      return
    }
    writeStored({ token, admin })
    set({ admin })
  },

  renew: (origin, token, admin) => {
    if (get().token !== origin) {
      return
    }
    abrir(token, admin)
    set({ token, admin })
    logger.info('platform.renewed')
  },

  signOut: () => {
    limpiar()
    set({ token: null, admin: null, expired: false })
    logger.info('platform.signed_out')
  },

  expire: () => {
    if (get().token === null) {
      return
    }
    limpiar()
    set({ token: null, admin: null, expired: true })
    logger.warn('platform.session_expired')
  },
}))

programarVencimiento(restored?.token ?? null)
setPlatformUnauthorizedHandler(() => {
  usePlatformSession.getState().expire()
})
