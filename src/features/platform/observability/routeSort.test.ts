import { describe, expect, it } from '@jest/globals'

import type { ObsRouteStats } from '@/api/types'
import { ariaSort, sortRoutes } from './routeSort'

function route(route: string, requests: number, p95: number, errors: number): ObsRouteStats {
  return { method: 'GET', route, requests, errors_5xx: errors, p50_ms: 1, p95_ms: p95, avg_db_ms: 1, sampled: false }
}

const ROUTES = [route('/a', 10, 300, 0), route('/b', 50, 20, 2), route('/c', 5, 900, 2)]

function order(routes: readonly ObsRouteStats[]): string[] {
  return routes.map((r) => r.route)
}

describe('sortRoutes', () => {
  it('de mayor a menor en la columna elegida', () => {
    expect(order(sortRoutes(ROUTES, 'requests'))).toEqual(['/b', '/a', '/c'])
    expect(order(sortRoutes(ROUTES, 'p95'))).toEqual(['/c', '/a', '/b'])
  })

  it('a igualdad, la más usada primero y después por nombre y método', () => {
    expect(order(sortRoutes(ROUTES, 'errors'))).toEqual(['/b', '/c', '/a'])
    const tie = [{ ...route('/z', 1, 1, 0), method: 'POST' }, route('/z', 1, 1, 0), route('/m', 1, 1, 0)]
    expect(sortRoutes(tie, 'requests').map((r) => `${r.method} ${r.route}`)).toEqual(['GET /m', 'GET /z', 'POST /z'])
  })

  it('no cambia la lista que recibe', () => {
    sortRoutes(ROUTES, 'p95')
    expect(order(ROUTES)).toEqual(['/a', '/b', '/c'])
  })
})

describe('ariaSort', () => {
  it('solo la columna elegida dice su orden', () => {
    expect(ariaSort('p95', 'p95')).toBe('descending')
    expect(ariaSort('requests', 'p95')).toBe('none')
  })
})
