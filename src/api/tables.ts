import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { CreateTableRequest, TableResponse, TableState, UpdateTableRequest } from './types'

// Las mesas del salon: su estado para el mesero y su administracion.

export const tablesQueryKey = ['tables'] as const

function tablesListQueryKey(includeInactive: boolean) {
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

/** Cada mesa con su estado y, si esta ocupada, un resumen de su pedido. */
export async function fetchTables(includeInactive = false): Promise<TableState[]> {
  return send((client) =>
    client.GET('/api/v1/tables', { params: { query: includeInactive ? { include_inactive: true } : {} } }),
  )
}

/** La consulta de las mesas, la misma para la pantalla y para precargarla. */
export function tablesQuery(includeInactive: boolean) {
  return queryOptions({
    queryKey: tablesListQueryKey(includeInactive),
    queryFn: () => fetchTables(includeInactive),
  })
}

export async function createTable(payload: CreateTableRequest): Promise<TableResponse> {
  return send((client) => client.POST('/api/v1/tables', { body: payload }))
}

export async function updateTable(
  tableId: number,
  payload: UpdateTableRequest,
): Promise<TableResponse> {
  return send((client) =>
    client.PATCH('/api/v1/tables/{table_id}', { params: { path: { table_id: tableId } }, body: payload }),
  )
}

/** El orden nuevo de todas las mesas, activas o no. */
export async function reorderTables(ids: number[]): Promise<TableResponse[]> {
  return send((client) => client.PUT('/api/v1/tables/order', { body: { ids } }))
}
