import { tableName } from '../../api/tables'
import type { TableState } from '../../api/types'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import { Button } from '../../components/ui/button'
import MoveButtons from './MoveButtons'
import TableStatusButton from './TableStatusButton'

interface TableAdminRowProps {
  readonly table: TableState
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly moving: boolean
  readonly onMove: (direction: -1 | 1) => void
  readonly onRename: () => void
}

/** Una mesa en la administracion: subir, bajar, renombrar, activar o desactivar. */
export default function TableAdminRow({ table, isFirst, isLast, moving, onMove, onRename }: TableAdminRowProps) {
  const pedido = table.active_order

  return (
    <li className="flex flex-wrap items-center gap-3 border-b py-3 last:border-b-0">
      <MoveButtons label={tableName(table.label)} isFirst={isFirst} isLast={isLast} disabled={moving} onMove={onMove} />
      <div className="flex min-w-32 flex-1 flex-col gap-1">
        <span className={`text-lg font-semibold ${table.is_active ? '' : 'text-muted-foreground'}`}>{tableName(table.label)}</span>
        <span className="flex flex-wrap gap-1.5">
          <StatusBadge label={table.is_active ? 'Activa' : 'Inactiva'} tone={table.is_active ? 'completed' : undefined} />
          {pedido === null ? null : <StatusBadge label={`Ocupada · pedido #${String(pedido.number)}`} tone="pending" />}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" className="h-11 px-3" onClick={onRename}>
          <Icon name="editar" size={16} />
          <span>Renombrar</span>
        </Button>
        <TableStatusButton table={table} />
      </div>
    </li>
  )
}
