import { tableName, updateTable } from '@/api/tables'
import type { TableState } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { withTable } from './tableCache'
import { useTableMutation } from './useTableMutation'

interface TableStatusButtonProps {
  readonly table: TableState
}

/**
 * Activa o desactiva una mesa.
 *
 * Una mesa desactivada deja de aparecer en el salon del mesero, pero conserva
 * sus pedidos. Con un pedido en curso no se desactiva: el servidor lo
 * rechazaria y el pedido quedaria sin mesa a la vista.
 */
export function TableStatusButton({ table }: TableStatusButtonProps) {
  const status = useTableMutation({
    mutationFn: () => updateTable(table.id, { is_active: !table.is_active }),
    failure: 'No se pudo cambiar la mesa.',
    updateCache: withTable,
    success: table.is_active ? `${tableName(table.label)} desactivada.` : `${tableName(table.label)} activada.`,
  })
  const isBlocked = table.is_active && table.active_order !== null

  return (
    <Button
      type="button"
      variant={table.is_active ? 'ghost' : 'secondary'}
      className="px-3"
      disabled={status.isPending || isBlocked}
      title={isBlocked ? 'No se desactiva una mesa con un pedido en curso' : undefined}
      onClick={() => {
        status.mutate(undefined)
      }}
    >
      <Icon name="turnOn" size={16} />
      <span>{table.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )
}
