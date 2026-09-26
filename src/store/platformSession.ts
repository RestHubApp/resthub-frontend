import { create } from 'zustand'

import { platformQueryKey } from '../api/platform'
import type { PlatformAdmin } from '../api/platformTypes'
import { setPlatformAuthToken, setPlatformUnauthorizedHandler } from '../services/api'
import { logger } from '../services/logger'
import { queryClient } from '../services/queryClient'
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
  /** Cambia el token por uno renovado sin cerrar la sesión. */
  renew: (token: string, admin: PlatformAdmin) => void
  signOut: () => void
  /** Cierra la sesión porque el servidor ya no acepta el token. */
  expire: () => void
}

// Una lectura o escritura puede fallar en una ventana privada o con el
// almacenamiento bloqueado: se trata como «no hay sesión guardada».
function readStored(): StoredPlatformSession | null {
  try {
    const raw = localStorage.getItem(PLATFORM_STORAGE_KEY)
    return raw === null ? null : (JSON.parse(raw) as StoredPlatformSession)
  } catch {
    return null
  }
}

function writeStored(session: StoredPlatformSession | null): void {
  try {
    if (session === null) {
      localStorage.removeItem(PLATFORM_STORAGE_KEY)
      return
    }
    localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(session))
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
  // Solo lo de plataforma: las consultas del restaurante son de otra sesión.
  queryClient.removeQueries({ queryKey: platformQueryKey })
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

  renew: (token, admin) => {
    if (get().token === null) {
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
