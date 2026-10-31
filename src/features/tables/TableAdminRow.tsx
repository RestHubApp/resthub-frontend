import { tableName } from '@/api/tables'
import type { TableState } from '@/api/types'
import { ActionsMenu, type ActionsMenuItem } from '@/components/ActionsMenu'
import { StatusBadge } from '@/components/StatusBadge'
import * as icons from '@/components/icons'
import { useTableStatus } from './useTableStatus'

interface TableAdminRowProps {
  readonly table: TableState
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly moving: boolean
  readonly onMove: (direction: -1 | 1) => void
  readonly onRename: () => void
}

type TableStatus = ReturnType<typeof useTableStatus>

/** Las acciones de la mesa: subir y bajar en el recorrido, renombrar y activar o desactivar. */
function tableEntries({ table, isFirst, isLast, moving, onMove, onRename }: TableAdminRowProps, status: TableStatus): ActionsMenuItem[] {
  const toggle: ActionsMenuItem = table.is_active
    ? { label: 'Desactivar', icon: icons.turnOn, isDestructive: true, isDisabled: status.isBlocked || status.isPending, onSelect: status.toggle }
    : { label: 'Activar', icon: icons.turnOn, isDisabled: status.isPending, onSelect: status.toggle }
  return [
    { label: 'Subir', icon: icons.up, isDisabled: isFirst || moving, onSelect: () => { onMove(-1) } },
    { label: 'Bajar', icon: icons.down, isDisabled: isLast || moving, onSelect: () => { onMove(1) } },
    { label: 'Renombrar', icon: icons.edit, onSelect: onRename },
    toggle,
  ]
}

/**
 * Una mesa en la administración: su nombre y su estado a la vista; subir,
 * bajar, renombrar y activar o desactivar, tras «⋯».
 *
 * Una mesa con un pedido en curso no se desactiva: la opción queda
 * deshabilitada y la fila ya dice que está ocupada.
 */
export function TableAdminRow(props: TableAdminRowProps) {
  const { table } = props
  const status = useTableStatus(table)
  const name = tableName(table.label)

  return (
    <li className="flex items-center gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`text-lg font-semibold break-words ${table.is_active ? '' : 'text-muted-foreground'}`}>{name}</span>
        <span className="flex flex-wrap gap-1.5">
          <StatusBadge label={table.is_active ? 'Activa' : 'Inactiva'} tone={table.is_active ? 'completed' : undefined} />
          {table.active_order === null ? null : (
            <StatusBadge label={`Ocupada · pedido #${String(table.active_order.number)}`} tone="pending" />
          )}
        </span>
      </div>
      <ActionsMenu label={`Más acciones de ${name}`} items={tableEntries(props, status)} />
    </li>
  )
}
