import type { ComponentType } from 'react'

import { asDefault } from '@/components/lazyNamed'
import { EmptyState } from '@/components/EmptyState'

// Al abrir la aplicacion directo en una pantalla perezosa (recargar el
// tablero), esto se ve dentro del armazon mientras llega su archivo.
const LOADING = <EmptyState title="Cargando…" />

type LoadScreen = () => Promise<{ default: ComponentType }>

/** Una ruta cuya pantalla se descarga recién al abrirla. */
export function lazyRoute(load: LoadScreen) {
  return { hydrateFallbackElement: LOADING, lazy: { Component: async () => (await load()).default } } as const
}

/** Una pantalla del área de plataforma, que se descarga recién al abrirla. */
export function platform<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazyRoute(asDefault(load, name))
}
