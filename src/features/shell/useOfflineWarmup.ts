import { useEffect } from 'react'

import type { PermissionCode } from '@/api/types'
import { cacheLoadedScripts } from '@/services/screenCache'
import type { ShellScreen } from './shellScreens'

// Se espera un poco después de que el service worker queda listo: lo primero es
// que la pantalla en que cayó la persona se vea y responda.
const WARMUP_DELAY_MS = 3000

/** Una pantalla del mesero sin señal que esta cuenta puede abrir. */
function isNeededOffline(screen: ShellScreen, permissions: readonly PermissionCode[]): boolean {
  return screen.offline === true && (screen.permission === undefined || permissions.includes(screen.permission))
}

/** Un archivo que no se pudo bajar se pedirá de nuevo al abrir la pantalla. */
function ignore(): undefined {
  return undefined
}

async function warmUp(screens: readonly ShellScreen[], permissions: readonly PermissionCode[]): Promise<void> {
  const needed = screens.filter((candidate) => isNeededOffline(candidate, permissions))
  await Promise.all(needed.flatMap(({ load }) => (load === undefined ? [] : [load().catch(ignore)])))
  await cacheLoadedScripts().catch(ignore)
}

/**
 * Baja, ya con sesión, las pantallas con las que el mesero sigue tomando
 * pedidos sin señal.
 *
 * El service worker solo precachea el armazón (no las pantallas) y guarda cada
 * archivo perezoso la primera vez que se pide. Para que Pedidos y el pedido
 * nuevo estén en el celular antes de que se corte la señal, sin haberlos
 * abierto, se piden aquí una vez que el service worker está listo, y se
 * guardan los que la página bajó antes de que él tomara el control. Quien nunca
 * entra a la aplicación (la primera visita al acceso) no paga nada de esto.
 */
export function useOfflineWarmup(screens: readonly ShellScreen[], permissions: readonly PermissionCode[]): void {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || permissions.length === 0) {
      return undefined
    }
    let timer: number | undefined
    void navigator.serviceWorker.ready.then(() => {
      timer = window.setTimeout(() => void warmUp(screens, permissions), WARMUP_DELAY_MS)
    })
    return () => {
      window.clearTimeout(timer)
    }
  }, [screens, permissions])
}
