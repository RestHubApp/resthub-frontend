import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { movementsQuery } from '@/api/inventory'
import type { Movement, MovementKind, MovementListParams } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { FormMessage } from '@/components/FormMessage'
import { StatusBadge } from '@/components/StatusBadge'
import { TablePagination } from '@/components/TablePagination'
import { errorMessage } from '@/services/api'
import { formatDateTime, formatSignedQuantity } from '@/services/format'
import { paths } from '@/services/paths'
import { useTimeZone } from '@/store/session'
import { MovementFilters } from './MovementFilters'
import { KIND_TONES } from './movementKinds'
import { formatUnitCost } from './units'
import { useIngredients } from './useIngredients'

const BY_PAGE = 20
function buildColumns(timeZone: string): DataColumn<Movement>[] {
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
        // El enlace usa el id; el texto, el número del día que ve el personal.
        <Link to={paths.orders.detail(mov.order_id)} className="font-medium text-primary underline-offset-4 hover:underline">
          {mov.order_number === null ? 'Ver pedido' : `Pedido #${String(mov.order_number)}`}
        </Link>
      ),
  },
  ]
}

/** El libro de movimientos: cada entrada y salida de stock, la más reciente primero. */
export function MovementsPanel() {
  const ingredients = useIngredients()
  const timeZone = useTimeZone()
  const columns = useMemo(() => buildColumns(timeZone), [timeZone])
  const [ingredient, setIngredient] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(0)

  const params: MovementListParams = {
    limit: BY_PAGE,
    offset: page * BY_PAGE,
    ...(ingredient === '' ? {} : { ingredient_id: Number(ingredient) }),
    ...(type === '' ? {} : { kind: [type as MovementKind] }),
  }
  const book = useQuery({ ...movementsQuery(params), placeholderData: keepPreviousData })
  const pages = Math.max(1, Math.ceil((book.data?.total ?? 0) / BY_PAGE))

  return (
    <div className="flex flex-col gap-4">
      <MovementFilters
        ingredients={ingredients.data ?? []}
        ingredientId={ingredient}
        onIngredient={(value) => {
          setIngredient(value)
          setPage(0)
        }}
        kind={type}
        onKind={(value) => {
          setType(value)
          setPage(0)
        }}
      />
      {book.isError ? (
        <FormMessage tone="error">
          {errorMessage(book.error, 'No se pudo cargar el libro de movimientos.')}
        </FormMessage>
      ) : (
        <DataTable
          columns={columns}
          data={book.data?.items ?? []}
          isLoading={book.isPending}
          emptyMessage="No hay movimientos con estos filtros."
          getRowId={(mov) => String(mov.id)}
        />
      )}
      {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
    </div>
  )
}
