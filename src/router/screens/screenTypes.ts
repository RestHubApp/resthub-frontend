import type { ComponentType } from 'react'

import type { ShellScreen } from '@/features/shell/shellScreens'

/** Una pantalla del restaurante: lo que el router, el menú y las guardas saben de ella. */
export interface Screen extends ShellScreen {
  /** Se descarga recién al abrirla (o antes, si el armazón la adelanta). */
  readonly load: () => Promise<{ default: ComponentType }>
  /** Abierta a todos, también sin sesión. Sin esto, la ruta exige sesión (y el permiso, si lo declara). */
  readonly public?: true
}

/**
 * Los datos de una pantalla se precargan con el mismo módulo que la pantalla
 * necesita al abrirse; el nombre es el de la función que exporta.
 */
export const prefetchOf = (load: () => Promise<Record<string, (() => void) | undefined>>, name: string) => () => {
  void load().then((module) => {
    module[name]?.()
  })
}
