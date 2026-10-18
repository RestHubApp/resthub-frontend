import type { Session, StaffSession } from '@/api/types'
import { isPreviewTab, tabStorage } from '@/services/tabStorage'

// Donde se guarda la sesion lo decide la pestana al cargarse (`tabStorage`):
// `localStorage` en una pestana normal y `sessionStorage` en una de vista
// previa, cada una con su clave. La version va en la clave: si cambia la forma
// de lo guardado, una sesion vieja se descarta en vez de leerse como si tuviera
// la forma nueva.
export const STORAGE = tabStorage.storage
export const STORAGE_KEY = tabStorage.sessionKey
// Las versiones anteriores ya no se leen; tampoco se dejan con un token adentro.
// La sesión de plataforma ya no es otra: es la misma que la del personal. La v2
// guardaba el token: desde la cookie de sesión (S2) ya no se guarda.
const OLD_STORAGE_KEYS = ['resthub.session.v1', 'resthub.platform-session.v1', 'resthub.session.v2'] as const

/**
 * Lo que se guarda de la sesión abierta.
 *
 * El token no: un script inyectado se lo llevaría de `localStorage`. Vive en
 * memoria y, para sobrevivir a una recarga, en la cookie `HttpOnly` del API,
 * de donde se recupera. La vista previa no tiene cookie y guarda su token en el
 * `sessionStorage` de su pestaña, como siempre.
 */
export interface StoredSession {
  /** Identifica cada inicio de sesión, para que las pestañas sepan si lo guardado sigue siendo lo suyo. No es secreto. */
  tag: string
  /** Cuándo vence el token, en milisegundos; `null` si no se pudo leer. */
  expiresAt: number | null
  account: Session
  /** Solo en una pestaña de vista previa. */
  token?: string
}

/**
 * Una sesión guardada antes de que la respuesta llevara `kind` es del personal,
 * como se leía entonces: así nadie vuelve a entrar solo por haber actualizado.
 */
function withKind(stored: StoredSession): StoredSession {
  const account: object = stored.account
  return 'kind' in account ? stored : { ...stored, account: { ...account, kind: 'staff' } as StaffSession }
}

/** Lectura de la sesión guardada: con el valor, o sin poder leer. */
export type Read = { readonly ok: true; readonly session: StoredSession | null } | { readonly ok: false }

// Lee la sesion guardada del navegador (la cuenta se guarda para que recargar
// la pagina no eche al usuario). Distingue «no hay sesión guardada» de «no se
// pudo leer»: sin almacenamiento no se sabe qué hizo otra pestaña, y eso no
// alcanza para cerrar la sesión de esta.
export function readSaved(): Read {
  if (STORAGE === null) {
    return { ok: false }
  }
  try {
    const raw = STORAGE.getItem(STORAGE_KEY)
    return { ok: true, session: raw === null ? null : withKind(JSON.parse(raw) as StoredSession) }
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

// La marca de la sesion que esta pestana guardo (o restauro) en el
// almacenamiento, si lo logro. Solo se compara lo guardado con lo que la
// pestana escribio: si nunca llego a guardarse (almacenamiento bloqueado o
// lleno), no hay nada que otra pestana haya podido cambiar.
export const persistence: { tag: string | null } = { tag: null }

export function writeStoredSession(session: StoredSession | null): void {
  persistence.tag = null
  try {
    if (session === null) {
      STORAGE?.removeItem(STORAGE_KEY)
      return
    }
    STORAGE?.setItem(STORAGE_KEY, JSON.stringify(session))
    persistence.tag = STORAGE === null ? null : session.tag
  } catch {
    // Sin almacenamiento la sesion dura lo que dure la pestana. Es una
    // degradacion aceptable; perder el acceso por no poder escribir no lo es.
  }
}

