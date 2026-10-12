import { tableName, updateTable } from '@/api/tables'
import type { TableState } from '@/api/types'
import { withTable } from './tableCache'
import { useTableMutation } from './useTableMutation'

/**
 * Activa o desactiva una mesa.
 *
 * Una mesa desactivada deja de aparecer en el salón del mesero, pero conserva
 * sus pedidos. Con un pedido en curso no se desactiva: el servidor lo
 * rechazaría y el pedido quedaría sin mesa a la vista.
 */
export function useTableStatus(table: TableState) {
  const status = useTableMutation({
    mutationFn: () => updateTable(table.id, { is_active: !table.is_active }),
    failure: 'No se pudo cambiar la mesa.',
    updateCache: withTable,
    success: table.is_active ? `${tableName(table.label)} desactivada.` : `${tableName(table.label)} activada.`,
  })

  return {
    isBlocked: table.is_active && table.active_order !== null,
    isPending: status.isPending,
    toggle: () => {
      status.mutate(undefined)
    },
  }
}
