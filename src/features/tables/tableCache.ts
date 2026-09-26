import type { TableResponse, TableState } from '../../api/types'
import { upsertInList } from '../../services/cacheList'

function alFinal(): boolean {
  return false
}

const LIBRE: Pick<TableState, 'status' | 'status_label' | 'active_order'> = {
  status: 'free',
  status_label: 'Libre',
  active_order: null,
}

/**
 * Las mesas con una creada o cambiada, con lo que devolvió el servidor.
 *
 * La respuesta no trae el estado de la mesa. Una existente conserva el suyo;
 * una nueva no puede tener pedidos, así que está libre. La relectura de fondo
 * trae la etiqueta del estado tal como la escribe el servidor.
 */
export function withTable(tables: readonly TableState[], table: TableResponse): TableState[] {
  const estado = tables.find((actual) => actual.id === table.id) ?? LIBRE
  return upsertInList(tables, { ...estado, ...table }, alFinal)
}

/** Las mesas en el orden que confirmó el servidor. */
export function withOrder(tables: readonly TableState[], ordered: readonly TableResponse[]): TableState[] {
  const porId = new Map(tables.map((table) => [table.id, table]))
  return ordered.flatMap((table) => {
    const previa = porId.get(table.id)
    return previa === undefined ? [] : [{ ...previa, ...table }]
  })
}
