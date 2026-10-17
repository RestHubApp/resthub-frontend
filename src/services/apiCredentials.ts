// La credencial de la sesión abierta, que acompaña a cada petición. La registra
// el almacén de sesión; los servicios son la capa más baja y no pueden
// importarlo.
import { tokenFor } from './apiRouting'

interface Credential {
  token: string | null
  onExpire: (() => void) | null
  onLock: (() => void) | null
  onReauthenticate: (() => Promise<boolean>) | null
}

const credential: Credential = { token: null, onExpire: null, onLock: null, onReauthenticate: null }

/**
 * Pone o quita la credencial que acompaña a cada petición.
 *
 * La llama el almacén de sesión, nunca al revés: los servicios son la capa más
 * baja y no pueden conocer el estado de cliente. Así el token vive en un solo
 * lugar y ninguna pantalla tiene que acordarse de adjuntarlo.
 */
export function setAuthToken(token: string | null): void {
  credential.token = token
}

/** El token abierto, para lo que no viaja por el cliente tipado (el canal de avisos). */
export function currentAuthToken(): string | null {
  return credential.token
}

/** Qué hacer cuando el servidor rechaza la credencial de una petición. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  credential.onExpire = handler
}

/** El token que lleva la petición a esa dirección: el de la sesión, o ninguno. */
export function bearerFor(url: string): string | null {
  return tokenFor(url, credential.token)
}

/** Cierra la sesión: el servidor ya no acepta su credencial. */
export function expireSession(): void {
  credential.onExpire?.()
}

/** Qué hacer cuando el servidor dice que la sesión quedó bloqueada por inactividad (423). */
export function setLockHandler(handler: (() => void) | null): void {
  credential.onLock = handler
}

/** Marca la sesión como bloqueada: solo se sigue después de desbloquearla. */
export function lockOpenSession(): void {
  credential.onLock?.()
}

/**
 * Cómo pedir la contraseña cuando una acción crítica la exige (403
 * `reauthentication_required`). El manejador resuelve `true` si la persona la
 * confirmó y la acción puede repetirse.
 */
export function setReauthenticationHandler(handler: (() => Promise<boolean>) | null): void {
  credential.onReauthenticate = handler
}

/** Pide la contraseña; `false` si no hay quién la pida o la persona desistió. */
export async function confirmIdentity(): Promise<boolean> {
  return credential.onReauthenticate === null ? false : credential.onReauthenticate()
}
