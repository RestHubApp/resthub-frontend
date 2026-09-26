import { createContext, useContext } from 'react'

import type { PermissionCode } from '../../api/types'

/** Lo que se puede adelantar de una pantalla antes de abrirla. */
export interface ScreenPreload {
  /** La ruta, como en el router: `tablero`, `panel/ia`. */
  readonly path: string
  /** El permiso que exige su ruta. Sin él, basta con la sesión. */
  readonly permission?: PermissionCode
  /** El mismo `import()` de la ruta perezosa: descarga el archivo de la pantalla. */
  readonly load?: () => Promise<unknown>
  /** Pone en el caché la consulta principal de la pantalla. */
  readonly prefetch?: () => void
}

/** Las pantallas que se pueden adelantar. Las entrega el router, que es quien las conoce. */
export const ScreenPreloadContext = createContext<readonly ScreenPreload[]>([])

export function allowedScreens(
  screens: readonly ScreenPreload[],
  permissions: readonly PermissionCode[],
): readonly ScreenPreload[] {
  return screens.filter(
    (screen) => screen.permission === undefined || permissions.includes(screen.permission),
  )
}

/** Un archivo que no se pudo bajar se vuelve a pedir al abrir la pantalla. */
export function ignorar(): undefined {
  return undefined
}

export function preloadScreen(screen: ScreenPreload): void {
  void screen.load?.().catch(ignorar)
  screen.prefetch?.()
}

/**
 * Los eventos de un enlace del menú que adelantan su pantalla.
 *
 * Entre que el puntero llega al enlace (o el dedo lo toca, o el teclado lo
 * enfoca) y el clic pasan unos cientos de milisegundos: se aprovechan para
 * bajar el archivo de la pantalla y pedir sus datos. El enlace solo se muestra
 * con permiso, así que nada de esto responde 403.
 */
export function useScreenPreload(to: string) {
  const screens = useContext(ScreenPreloadContext)
  const screen = screens.find((candidate) => `/${candidate.path}` === to)
  const preload = () => {
    if (screen !== undefined) {
      preloadScreen(screen)
    }
  }
  return { onPointerEnter: preload, onFocus: preload, onTouchStart: preload }
}
