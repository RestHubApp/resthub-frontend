import type { Movement } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDateTime, formatSignedQuantity } from '@/services/format'
import { MovementOrderLink } from './MovementOrderLink'
import { KIND_TONES } from './movementKinds'
import { formatUnitCost } from './units'

/** Las columnas del libro de movimientos; la fecha se muestra en la zona horaria del local. */
export function buildMovementColumns(timeZone: string): DataColumn<Movement>[] {
  return [
    { id: 'fecha', header: 'Fecha', className: 'tabular-nums', cell: (mov) => formatDateTime(mov.created_at, timeZone) },
    { id: 'insumo', header: 'Insumo', cell: (mov) => mov.ingredient_name },
    { id: 'tipo', header: 'Tipo', cell: (mov) => <StatusBadge label={mov.kind_label} tone={KIND_TONES[mov.kind]} /> },
    {
      id: 'cantidad',
      header: 'Cantidad',
      className: 'tabular-nums font-semibold',
      cell: (mov) => (
        <span className={Number(mov.quantity) < 0 ? 'text-destructive' : 'text-success'}>
          {formatSignedQuantity(mov.quantity, mov.unit)}
        </span>
      ),
    },
    {
      id: 'costo',
      header: 'Costo',
      className: 'tabular-nums',
      cell: (mov) => (mov.unit_cost === null ? '—' : formatUnitCost(mov.unit_cost, mov.unit)),
    },
    {
      id: 'motivo',
      header: 'Motivo',
      className: 'min-w-48 whitespace-normal',
      cell: (mov) =>
        mov.order_id === null ? (
          mov.reason || '—'
        ) : (
          <MovementOrderLink orderId={mov.order_id} orderNumber={mov.order_number} />
        ),
    },
  ]
}
