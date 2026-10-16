import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import { inventoryQueryKey } from './inventory'
import type {
  CountDifferences,
  CountLineRequest,
  IngredientCountHistory,
  OpenStockCountRequest,
  StockCount,
  StockCountListParams,
  StockCountPage,
} from './types'

// Conteos físicos: se cuenta lo que hay en el local y, al cerrar, cada
// diferencia con el sistema se vuelve un ajuste. Uno en curso por local.

const stockCountsQueryKey = [...inventoryQueryKey, 'stock-counts'] as const

/** Las listas de conteos (el que está en curso y el historial), para releerlas juntas. */
export const stockCountListsQueryKey = [...stockCountsQueryKey, 'list'] as const

export function stockCountQueryKey(countId: number) {
  return [...stockCountsQueryKey, 'detail', countId] as const
}

async function fetchStockCounts(params: StockCountListParams): Promise<StockCountPage> {
  return send((client) => client.GET('/api/v1/inventory/stock-counts', { params: { query: params } }))
}

/** Los conteos, del más nuevo al más viejo. Con `status: 'draft'`, el que está en curso. */
export function stockCountsQuery(params: StockCountListParams) {
  return queryOptions({
    queryKey: [...stockCountListsQueryKey, params] as const,
    queryFn: () => fetchStockCounts(params),
  })
}

async function fetchStockCount(countId: number): Promise<StockCount> {
  return send((client) =>
    client.GET('/api/v1/inventory/stock-counts/{count_id}', { params: { path: { count_id: countId } } }),
  )
}

export function stockCountQuery(countId: number) {
  return queryOptions({ queryKey: stockCountQueryKey(countId), queryFn: () => fetchStockCount(countId) })
}

export async function openStockCount(payload: OpenStockCountRequest): Promise<StockCount> {
  return send((client) => client.POST('/api/v1/inventory/stock-counts', { body: payload }))
}

/** Carga o corrige solo las líneas que cambian; `quantity: null` deja una línea sin contar. */
export async function recordCountLines(countId: number, lines: readonly CountLineRequest[]): Promise<StockCount> {
  return send((client) =>
    client.PUT('/api/v1/inventory/stock-counts/{count_id}/lines', {
      params: { path: { count_id: countId } },
      body: { lines: [...lines] },
    }),
  )
}

/** Cierra el conteo: cada línea contada con diferencia se vuelve un ajuste del stock. */
export async function closeStockCount(countId: number): Promise<StockCount> {
  return send((client) =>
    client.POST('/api/v1/inventory/stock-counts/{count_id}/close', { params: { path: { count_id: countId } } }),
  )
}

export async function cancelStockCount(countId: number): Promise<StockCount> {
  return send((client) =>
    client.POST('/api/v1/inventory/stock-counts/{count_id}/cancel', { params: { path: { count_id: countId } } }),
  )
}

async function fetchCountDifferences(countId: number): Promise<CountDifferences> {
  return send((client) =>
    client.GET('/api/v1/inventory/stock-counts/{count_id}/differences', { params: { path: { count_id: countId } } }),
  )
}

/** Las diferencias de un conteo cerrado, de la mayor pérdida a la mayor sobra. */
export function countDifferencesQuery(countId: number) {
  return queryOptions({
    queryKey: [...stockCountQueryKey(countId), 'differences'] as const,
    queryFn: () => fetchCountDifferences(countId),
  })
}

/** Cuántas diferencias de un insumo se piden para su tendencia. */
const HISTORY_LIMIT = 10

async function fetchIngredientCountHistory(ingredientId: number): Promise<IngredientCountHistory> {
  return send((client) =>
    client.GET('/api/v1/inventory/ingredients/{ingredient_id}/count-differences', {
      params: { path: { ingredient_id: ingredientId }, query: { limit: HISTORY_LIMIT } },
    }),
  )
}

/** Las diferencias de un insumo en sus últimos conteos cerrados, del más nuevo al más viejo. */
export function ingredientCountHistoryQuery(ingredientId: number) {
  return queryOptions({
    queryKey: [...stockCountsQueryKey, 'history', ingredientId] as const,
    queryFn: () => fetchIngredientCountHistory(ingredientId),
  })
}
