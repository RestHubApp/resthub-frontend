// El vencimiento de un token, comun a la sesion de restaurante y a la del
// administrador del sistema.

const MS_POR_SEGUNDO = 1000

/**
 * Cuando vence el token, en milisegundos, o `null` si no se puede leer.
 *
 * Solo se lee la fecha de vencimiento para no mostrar pantallas que igual van a
 * responder 401. La firma la comprueba el servidor, que es quien decide.
 */
export function tokenExpiresAt(token: string): number | null {
  try {
    const carga = token.split('.')[1] ?? ''
    const datos = JSON.parse(atob(carga.replaceAll('-', '+').replaceAll('_', '/'))) as {
      exp?: unknown
    }
    return typeof datos.exp === 'number' ? datos.exp * MS_POR_SEGUNDO : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, now: number = Date.now()): boolean {
  const vencimiento = tokenExpiresAt(token)
  return vencimiento !== null && vencimiento <= now
}

/**
 * Un temporizador que cierra una sesion en el momento en que vence su token,
 * en vez de esperar a que una pantalla se quede sin datos por un 401.
 *
 * Devuelve la funcion que lo reprograma; con `null` solo lo apaga.
 */
export function expiryTimer(onExpire: () => void): (token: string | null) => void {
  let id: ReturnType<typeof setTimeout> | undefined
  return (token) => {
    clearTimeout(id)
    const vencimiento = token === null ? null : tokenExpiresAt(token)
    if (vencimiento === null) {
      return
    }
    id = setTimeout(onExpire, Math.max(vencimiento - Date.now(), 0))
  }
}
