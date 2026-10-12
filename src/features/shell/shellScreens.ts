import { createContext, useContext } from 'react'

import type { AnyPermissionCode } from '@/api/types'
import type { ShellIconName } from './ShellIcon'

/** Cómo se muestra una pantalla en el menú. */
export interface ScreenNav {
  readonly label: string
  readonly icon: ShellIconName
  /** Para que sirve la pantalla. Lo muestra el aviso de "Próximamente". */
  readonly description: string
  /**
   * Otras rutas en las que la entrada sigue marcada, como prefijos: la ficha y
   * el alta de un restaurante marcan «Restaurantes». Sin esto, la entrada se
   * marca en su ruta y en las que cuelgan de ella.
   */
  readonly activeOn?: readonly string[]
}

/**
 * Lo que el armazón sabe de una pantalla: su ruta, el permiso que la abre, su
 * entrada del menú si la tiene y lo que se puede adelantar antes de abrirla.
 *
 * El registro de pantallas (`src/router/screens.ts`) es quien las declara; el
 * armazón las recibe por prop y de ahí salen el menú y la precarga.
 */
export interface ShellScreen {
  /** La ruta, como la entiende el router: `/tablero`, `/panel/ia`. */
  readonly path: string
  /** El permiso que exige su ruta y que muestra su entrada. Sin él, basta con la sesión. */
  readonly permission?: AnyPermissionCode
  /** La entrada del menú. Sin ella, la pantalla no sale en el menú. */
  readonly nav?: ScreenNav
  /** El mismo `import()` de la ruta perezosa: descarga el archivo de la pantalla. */
  readonly load?: () => Promise<unknown>
  /** Pone en el caché la consulta principal de la pantalla. */
  readonly prefetch?: () => void
  /**
   * La pantalla tiene que estar en el celular aunque se corte la señal (tomar
   * pedidos): se descarga al entrar, sin esperar a que se abra, para que el
   * service worker la guarde (ver `useOfflineWarmup`).
   */
  readonly offline?: true
}

/** Las pantallas del armazón. Las entrega el router, que es quien las conoce. */
export const ShellScreensContext = createContext<readonly ShellScreen[]>([])

export function useShellScreens(): readonly ShellScreen[] {
  return useContext(ShellScreensContext)
}

/** Un archivo que no se pudo bajar se vuelve a pedir al abrir la pantalla. */
function ignore(): undefined {
  return undefined
}

/** Baja el archivo de la pantalla y pide sus datos, sin abrirla. */
export function preloadScreen(screen: ShellScreen): void {
  void screen.load?.().catch(ignore)
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
  const screen = useShellScreens().find((candidate) => candidate.path === to)
  const preload = () => {
    if (screen !== undefined) {
      preloadScreen(screen)
    }
  }
  return { onPointerEnter: preload, onFocus: preload, onTouchStart: preload }
}
