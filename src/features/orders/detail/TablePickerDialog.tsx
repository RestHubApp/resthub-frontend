import { useQuery } from '@tanstack/react-query'

import { tableName, tablesQuery } from '../../../api/tables'
import type { TableState } from '../../../api/types'
import EmptyState from '../../../components/EmptyState'
import FormDialog from '../../../components/FormDialog'
import { Button } from '../../../components/ui/button'
import { formatMoney } from '../../../services/format'

interface TablePickerDialogProps {
  readonly open: boolean
  readonly title: string
  readonly description: string
  /** Qué mesas se ofrecen: las libres para mudarse, las ocupadas para unir. */
  readonly filter: (table: TableState) => boolean
  readonly empty: string
  readonly pending: boolean
  readonly onPick: (table: TableState) => void
  readonly onClose: () => void
}

/**
 * Elegir una mesa del salón, como fichas grandes para el pulgar.
 *
 * Sirve para mudar un pedido (mesas libres) y para unir otra mesa a esta
 * (mesas con pedido): lo que cambia es qué mesas se ofrecen.
 */
export default function TablePickerDialog({
  open,
  title,
  description,
  filter,
  empty,
  pending,
  onPick,
  onClose,
}: TablePickerDialogProps) {
  const mesas = useQuery({ ...tablesQuery(false), enabled: open })
  const opciones = (mesas.data ?? []).filter(filter)

  return (
    <FormDialog
      open={open}
      title={title}
      description={description}
      onOpenChange={(abierto) => {
        if (!abierto) {
          onClose()
        }
      }}
    >
      {mesas.isSuccess && opciones.length === 0 ? <EmptyState title={empty} /> : null}
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
        {opciones.map((mesa) => (
          <li key={mesa.id}>
            <Button
              type="button"
              variant="outline"
              className="flex h-auto min-h-14 w-full flex-col gap-0.5 py-2"
              disabled={pending}
              onClick={() => {
                onPick(mesa)
              }}
            >
              <span className="font-semibold">{tableName(mesa.label)}</span>
              {mesa.active_order === null ? null : (
                <span className="text-xs text-muted-foreground">
                  #{mesa.active_order.number} · {formatMoney(mesa.active_order.total)}
                </span>
              )}
            </Button>
          </li>
        ))}
      </ul>
    </FormDialog>
  )
}
