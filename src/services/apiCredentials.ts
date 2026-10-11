// Las dos sesiones que pueden estar abiertas en el mismo navegador: la de una
// cuenta de restaurante y la del administrador del sistema. Las registran sus
// almacenes; los servicios son la capa más baja y no pueden importarlos.
import { isPlatformPath, tokenFor } from './apiRouting'

interface Credential {
  token: string | null
  onExpire: (() => void) | null
}

const restaurant: Credential = { token: null, onExpire: null }
const platform: Credential = { token: null, onExpire: null }

/**
 * Pone o quita la credencial que acompaña a cada petición de restaurante.
 *
 * La llama el almacén de sesión, nunca al revés: los servicios son la capa más
 * baja y no pueden conocer el estado de cliente. Así el token vive en un solo
 * lugar y ninguna pantalla tiene que acordarse de adjuntarlo.
 */
export function setAuthToken(token: string | null): void {
  restaurant.token = token
}

/** La credencial de las peticiones a `/platform/*`. La llama el almacén de la sesión de plataforma. */
export function setPlatformAuthToken(token: string | null): void {
  platform.token = token
}

/** El token de restaurante abierto, para lo que no viaja por el cliente tipado (el canal de avisos). */
export function currentAuthToken(): string | null {
  return restaurant.token
}

/** Qué hacer cuando el servidor rechaza la credencial de una petición de restaurante. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  restaurant.onExpire = handler
}

/** Lo mismo, para las peticiones del administrador del sistema. */
export function setPlatformUnauthorizedHandler(handler: (() => void) | null): void {
  platform.onExpire = handler
}

/** El token que lleva la petición a esa dirección: el de su sesión, o ninguno. */
export function bearerFor(url: string): string | null {
  return tokenFor(url, { restaurant: restaurant.token, platform: platform.token })
}

/** Cierra la sesión dueña de la ruta: la otra sigue abierta. */
export function expireSessionOf(url: string): void {
  const credential = isPlatformPath(url) ? platform : restaurant
  credential.onExpire?.()
}
