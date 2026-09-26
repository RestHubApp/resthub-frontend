import type { ObsRouteSort, ObsRouteStats } from '../../../api/types'

export interface RouteSortOption {
  readonly value: ObsRouteSort
  readonly label: string
}

/** Las columnas por las que se ordena la tabla de rutas, siempre de mayor a menor. */
export const ROUTE_SORTS: readonly RouteSortOption[] = [
  { value: 'requests', label: 'Peticiones' },
  { value: 'p95', label: 'p95' },
  { value: 'errors', label: 'Errores 5xx' },
]

export const DEFAULT_ROUTE_SORT: ObsRouteSort = 'requests'

/** Cuántas rutas pide la tabla. */
export const ROUTES_LIMIT = 20

const METRIC: Readonly<Record<ObsRouteSort, (route: ObsRouteStats) => number>> = {
  requests: (route) => route.requests,
  p95: (route) => route.p95_ms,
  errors: (route) => route.errors_5xx,
}

/**
 * Las rutas de mayor a menor en la columna elegida; a igualdad, la más usada
 * primero y después por nombre, para que el orden no baile entre lecturas.
 *
 * El servidor ya devuelve sus 20 primeras en ese orden. Esto reordena al
 * instante lo que se está viendo mientras llegan las de la columna nueva, que
 * pueden ser otras: las 20 más lentas no son las 20 más usadas.
 */
export function sortRoutes(routes: readonly ObsRouteStats[], sort: ObsRouteSort): ObsRouteStats[] {
  const metrica = METRIC[sort]
  return [...routes].sort(
    (a, b) =>
      metrica(b) - metrica(a) ||
      b.requests - a.requests ||
      a.route.localeCompare(b.route) ||
      a.method.localeCompare(b.method),
  )
}

/** Lo que dice `aria-sort` en la cabecera de una columna. */
export function ariaSort(column: ObsRouteSort, sort: ObsRouteSort): 'descending' | 'none' {
  return column === sort ? 'descending' : 'none'
}
