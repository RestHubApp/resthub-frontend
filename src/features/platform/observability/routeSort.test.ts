import { describe, expect, it } from 'vitest'

import type { ObsRouteStats } from '../../../api/types'
import { ariaSort, sortRoutes } from './routeSort'

function ruta(route: string, requests: number, p95: number, errors: number): ObsRouteStats {
  return { method: 'GET', route, requests, errors_5xx: errors, p50_ms: 1, p95_ms: p95, avg_db_ms: 1, sampled: false }
}

const RUTAS = [ruta('/a', 10, 300, 0), ruta('/b', 50, 20, 2), ruta('/c', 5, 900, 2)]

function orden(rutas: readonly ObsRouteStats[]): string[] {
  return rutas.map((r) => r.route)
}

describe('sortRoutes', () => {
  it('de mayor a menor en la columna elegida', () => {
    expect(orden(sortRoutes(RUTAS, 'requests'))).toEqual(['/b', '/a', '/c'])
    expect(orden(sortRoutes(RUTAS, 'p95'))).toEqual(['/c', '/a', '/b'])
  })

  it('a igualdad, la más usada primero y después por nombre y método', () => {
    expect(orden(sortRoutes(RUTAS, 'errors'))).toEqual(['/b', '/c', '/a'])
    const empate = [{ ...ruta('/z', 1, 1, 0), method: 'POST' }, ruta('/z', 1, 1, 0), ruta('/m', 1, 1, 0)]
    expect(sortRoutes(empate, 'requests').map((r) => `${r.method} ${r.route}`)).toEqual(['GET /m', 'GET /z', 'POST /z'])
  })

  it('no cambia la lista que recibe', () => {
    sortRoutes(RUTAS, 'p95')
    expect(orden(RUTAS)).toEqual(['/a', '/b', '/c'])
  })
})

describe('ariaSort', () => {
  it('solo la columna elegida dice su orden', () => {
    expect(ariaSort('p95', 'p95')).toBe('descending')
    expect(ariaSort('requests', 'p95')).toBe('none')
  })
})
