import { tableName, updateTable } from '../../api/tables'
import type { TableState } from '../../api/types'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
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
export default function TableStatusButton({ table }: TableStatusButtonProps) {
  const estado = useTableMutation({
    mutationFn: () => updateTable(table.id, { is_active: !table.is_active }),
    failure: 'No se pudo cambiar la mesa.',
    updateCache: withTable,
    success: table.is_active ? `${tableName(table.label)} desactivada.` : `${tableName(table.label)} activada.`,
  })
  const bloqueada = table.is_active && table.active_order !== null

  return (
    <Button
      type="button"
      variant={table.is_active ? 'ghost' : 'success'}
      className="h-11 px-3"
      disabled={estado.isPending || bloqueada}
      title={bloqueada ? 'No se desactiva una mesa con un pedido en curso' : undefined}
      onClick={() => {
        estado.mutate(undefined)
      }}
    >
      <Icon name="encender" size={16} />
      <span>{table.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )
}
