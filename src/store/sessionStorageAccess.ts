import type { CurrentUserResponse } from '@/api/types'
import { isPreviewTab, tabStorage } from '@/services/tabStorage'

// Donde se guarda la sesion lo decide la pestana al cargarse (`tabStorage`):
// `localStorage` en una pestana normal y `sessionStorage` en una de vista
// previa, cada una con su clave. La version va en la clave: si cambia la forma
// de lo guardado, una sesion vieja se descarta en vez de leerse como si tuviera
// la forma nueva.
export const STORAGE = tabStorage.storage
export const STORAGE_KEY = tabStorage.sessionKey
// Las versiones anteriores ya no se leen; tampoco se dejan con un token adentro.
const OLD_STORAGE_KEYS = ['resthub.session.v1'] as const

export interface StoredSession {
  token: string
  account: CurrentUserResponse
}

/** Lectura de la sesión guardada: con el valor, o sin poder leer. */
export type Read = { readonly ok: true; readonly session: StoredSession | null } | { readonly ok: false }

// Lee la sesion guardada del navegador (el token se guarda para que recargar
// la pagina no eche al usuario). Distingue «no hay sesión guardada» de «no se
// pudo leer»: sin almacenamiento no se sabe qué hizo otra pestaña, y eso no
// alcanza para cerrar la sesión de esta.
export function readSaved(): Read {
  if (STORAGE === null) {
    return { ok: false }
  }
  try {
    const raw = STORAGE.getItem(STORAGE_KEY)
    return { ok: true, session: raw === null ? null : (JSON.parse(raw) as StoredSession) }
  } catch {
    return { ok: false }
  }
}

export function forgetOldSessions(): void {
  // Una pestana de vista previa no toca lo que hay en `localStorage`.
  if (isPreviewTab()) {
    return
  }
  try {
    for (const key of OLD_STORAGE_KEYS) {
      STORAGE?.removeItem(key)
    }
  } catch {
    // Sin almacenamiento tampoco hay nada viejo que borrar.
  }
}

// El token que esta pestana guardo (o restauro) en el almacenamiento, si lo
// logro. Solo se compara lo guardado con lo que la pestana escribio: si nunca
// llego a guardarse (almacenamiento bloqueado o lleno), no hay nada que otra
// pestana haya podido cambiar.
export const persistence: { token: string | null } = { token: null }

export function writeStoredSession(session: StoredSession | null): void {
  persistence.token = null
  try {
    if (session === null) {
      STORAGE?.removeItem(STORAGE_KEY)
      return
    }
    STORAGE?.setItem(STORAGE_KEY, JSON.stringify(session))
    persistence.token = STORAGE === null ? null : session.token
  } catch {
    // Sin almacenamiento la sesion dura lo que dure la pestana. Es una
    // degradacion aceptable; perder el acceso por no poder escribir no lo es.
  }
}

