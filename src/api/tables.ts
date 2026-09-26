import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type { CreateTableRequest, TableResponse, TableState, UpdateTableRequest } from './types'

// Las mesas del salon: su estado para el mesero y su administracion.

export const tablesQueryKey = ['tables'] as const

export function tablesListQueryKey(includeInactive: boolean) {
  return [...tablesQueryKey, { includeInactive }] as const
}

/**
 * "Mesa 5" para una mesa numerada; "Terraza 2" o "Barra", tal cual.
 *
 * El encargado nombra las mesas como quiere; casi siempre con un numero, y un
 * "5" suelto en un titulo no dice que es una mesa.
 */
export function tableName(label: string): string {
  return /^\d+$/u.test(label) ? `Mesa ${label}` : label
}

function tablePath(tableId: number): string {
  return `/tables/${String(tableId)}`
}

/** Cada mesa con su estado y, si esta ocupada, un resumen de su pedido. */
export async function fetchTables(includeInactive = false): Promise<TableState[]> {
  const { data } = await api.get<TableState[]>('/tables', {
    params: includeInactive ? { include_inactive: true } : undefined,
  })
  return data
}

/** La consulta de las mesas, la misma para la pantalla y para precargarla. */
export function tablesQuery(includeInactive: boolean) {
  return queryOptions({
    queryKey: tablesListQueryKey(includeInactive),
    queryFn: () => fetchTables(includeInactive),
  })
}

export async function createTable(payload: CreateTableRequest): Promise<TableResponse> {
  const { data } = await api.post<TableResponse>('/tables', payload)
  return data
}

export async function updateTable(
  tableId: number,
  payload: UpdateTableRequest,
): Promise<TableResponse> {
  const { data } = await api.patch<TableResponse>(tablePath(tableId), payload)
  return data
}

/** El orden nuevo de todas las mesas, activas o no. */
export async function reorderTables(ids: number[]): Promise<TableResponse[]> {
  const { data } = await api.put<TableResponse[]>('/tables/order', { ids })
  return data
}
