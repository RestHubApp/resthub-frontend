import { type ComponentType, lazy, type LazyExoticComponent } from 'react'

/**
 * Adapta un módulo con exports con nombre a la forma `{ default }` que piden
 * `React.lazy` y las rutas perezosas del router.
 */
export function asDefault<K extends string, P>(
  load: () => Promise<Record<K, ComponentType<P>>>,
  name: K,
): () => Promise<{ default: ComponentType<P> }> {
  return () => load().then((module) => ({ default: module[name] }))
}

/** Un componente que se descarga recién al montarse. */
export function lazyNamed<K extends string, P>(
  load: () => Promise<Record<K, ComponentType<P>>>,
  name: K,
): LazyExoticComponent<ComponentType<P>> {
  return lazy(asDefault(load, name))
}
