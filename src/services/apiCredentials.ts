// La credencial de la sesión abierta, que acompaña a cada petición. La registra
// el almacén de sesión; los servicios son la capa más baja y no pueden
// importarlo.
import { tokenFor } from './apiRouting'

interface Credential {
  token: string | null
  /** Hay una sesión en la cookie `HttpOnly` del API (S2): sin token, la petición viaja con ella. */
  cookie: boolean
  /** El valor anti-CSRF de esa cookie: lo exige el servidor en lo que cambia algo. */
  csrf: string | null
  onCsrfLost: (() => Promise<boolean>) | null
  onExpire: ((token: string | null) => void) | null
  onLock: (() => void) | null
  onReauthenticate: (() => Promise<boolean>) | null
  onPasswordChange: (() => void) | null
}

const credential: Credential = {
  token: null,
  cookie: false,
  csrf: null,
  onCsrfLost: null,
  onExpire: null,
  onLock: null,
  onReauthenticate: null,
  onPasswordChange: null,
}

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

/** Qué hacer cuando el servidor rechaza la credencial de una petición: recibe el token que llevaba (`null`, la cookie). */
export function setUnauthorizedHandler(handler: ((token: string | null) => void) | null): void {
  credential.onExpire = handler
}

/** El token que lleva la petición a esa dirección: el de la sesión, o ninguno. */
export function bearerFor(url: string): string | null {
  return tokenFor(url, credential.token)
}

/** El servidor ya no acepta la credencial `token` (`null`: la cookie). */
export function expireSession(token: string | null): void {
  credential.onExpire?.(token)
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

/** Qué hacer cuando el servidor pide cambiar la contraseña temporal (403 `password_change_required`). */
export function setPasswordChangeHandler(handler: (() => void) | null): void {
  credential.onPasswordChange = handler
}

/** La cuenta tiene que cambiar su contraseña temporal antes de seguir (RFS-20). */
export function requirePasswordChange(): void {
  credential.onPasswordChange?.()
}

/**
 * Si la sesión abierta también vive en la cookie del API. La pone el almacén de
 * sesión: tras recargar la página no hay token en memoria y las peticiones
 * viajan con la cookie hasta recuperarlo.
 */
export function setCookieSession(isOpen: boolean): void {
  credential.cookie = isOpen
}

/** Si una petición sin token igual lleva la sesión, en la cookie. */
export function hasCookieSession(): boolean {
  return credential.cookie
}

/** Anota el valor anti-CSRF que trajo una respuesta del acceso, de la renovación o de `GET /auth/me`. */
export function setCsrfToken(value: string | null | undefined): void {
  if (typeof value === 'string' && value !== '') {
    credential.csrf = value
  }
}

/** El valor anti-CSRF de la cookie de sesión, si ya se conoce. */
export function csrfToken(): string | null {
  return credential.csrf
}

/** Cómo volver a leer el valor anti-CSRF cuando el servidor dice que no coincide (otra pestaña renovó la cookie). */
export function setCsrfRecovery(handler: (() => Promise<boolean>) | null): void {
  credential.onCsrfLost = handler
}

/** Relee el valor anti-CSRF; `false` si no hay cómo o no se pudo. */
export async function recoverCsrf(): Promise<boolean> {
  return credential.onCsrfLost === null ? false : credential.onCsrfLost()
}
