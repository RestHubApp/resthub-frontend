import { type changeOwnPassword, sessionOf } from '@/api/auth'
import { useSession } from '@/store/session'

type Change = Awaited<ReturnType<typeof changeOwnPassword>>

/** Qué pasó con la sesión tras cambiar la contraseña. */
export type PasswordChangeOutcome = 'renovada' | 'cerrada' | 'ajena'

/** Token nuevo de la respuesta; un servidor viejo respondía 204 sin cuerpo, y ahí no hay. */
function freshTokenOf(response: Change): string {
  return (response as Partial<Change> | null | undefined)?.access_token ?? ''
}

/**
 * Decide qué hacer con la sesión según lo que hay guardado ahora.
 *
 * Otra pestaña que ya entró con otra sesión y esta la adoptó: cerrar aquí
 * borraría lo guardado y sacaría también a esa otra cuenta. Sin token nuevo, o
 * con la sesión cerrada en otra pestaña, seguir con el token viejo solo daría
 * 401: se cierra y se vuelve al acceso con el aviso.
 */
function settle(fresh: string, origin: string | null): PasswordChangeOutcome {
  const actual = useSession.getState().token
  if (fresh !== '' && actual === fresh) {
    return 'renovada'
  }
  if (actual !== null && actual !== origin) {
    return 'ajena'
  }
  useSession.getState().signOutAfterPasswordChange()
  return 'cerrada'
}

/**
 * Sigue con el token que devolvió el cambio de contraseña.
 *
 * El servidor corta todos los tokens anteriores, el de `origen` incluido, y
 * devuelve el único válido: al quedar guardado, las otras pestañas lo adoptan
 * en vez de seguir con uno que da 401. Sin segundo acceso: la clave nueva no
 * vuelve a viajar.
 */
export function followWithNewToken(response: Change, origin: string | null): PasswordChangeOutcome {
  const fresh = freshTokenOf(response)
  if (fresh !== '') {
    useSession.getState().renew(origin, fresh, sessionOf(response))
  }
  return settle(fresh, origin)
}
