// El vencimiento de un token, comun a la sesion de restaurante y a la del
// administrador del sistema.

const MS_BY_SECOND = 1000

/**
 * Cuando vence el token, en milisegundos, o `null` si no se puede leer.
 *
 * Solo se lee la fecha de vencimiento para no mostrar pantallas que igual van a
 * responder 401. La firma la comprueba el servidor, que es quien decide.
 */
export function tokenExpiresAt(token: string): number | null {
  try {
    const load = token.split('.')[1] ?? ''
    const data = JSON.parse(atob(load.replaceAll('-', '+').replaceAll('_', '/'))) as {
      exp?: unknown
    }
    return typeof data.exp === 'number' ? data.exp * MS_BY_SECOND : null
  } catch {
    return null
  }
}

/**
 * Un temporizador que cierra una sesion en el momento en que vence su token,
 * en vez de esperar a que una pantalla se quede sin datos por un 401.
 *
 * Devuelve la funcion que lo reprograma con el vencimiento en milisegundos
 * (`tokenExpiresAt`); con `null` solo lo apaga.
 */
export function expiryTimer(onExpire: () => void): (expiry: number | null) => void {
  let id: ReturnType<typeof setTimeout> | undefined
  return (expiry) => {
    clearTimeout(id)
    if (expiry === null) {
      return
    }
    id = setTimeout(onExpire, Math.max(expiry - Date.now(), 0))
  }
}
