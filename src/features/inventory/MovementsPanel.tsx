import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { fetchMovements, movementListQueryKey } from '../../api/inventory'
import type { Movement, MovementKind, MovementListParams } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import FormMessage from '../../components/FormMessage'
import StatusBadge from '../../components/StatusBadge'
import TablePagination from '../../components/TablePagination'
import { errorMessage } from '../../services/api'
import { formatDateTime, formatSignedQuantity } from '../../services/format'
import { useTimeZone } from '../../store/session'
import MovementFilters from './MovementFilters'
import { KIND_TONES } from './movementKinds'
import { formatUnitCost } from './units'
import { useIngredients } from './useIngredients'

const POR_PAGINA = 20
function columnas(timeZone: string): DataColumn<Movement>[] {
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
        <Link to={`/pedidos/${String(mov.order_id)}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {mov.order_number === null ? 'Ver pedido' : `Pedido #${String(mov.order_number)}`}
        </Link>
      ),
  },
  ]
}

/** El libro de movimientos: cada entrada y salida de stock, la más reciente primero. */
export default function MovementsPanel() {
  const insumos = useIngredients()
  const timeZone = useTimeZone()
  const columns = useMemo(() => columnas(timeZone), [timeZone])
  const [insumo, setInsumo] = useState('')
  const [tipo, setTipo] = useState('')
  const [pagina, setPagina] = useState(0)

  const params: MovementListParams = {
    limit: POR_PAGINA,
    offset: pagina * POR_PAGINA,
    ...(insumo === '' ? {} : { ingredient_id: Number(insumo) }),
    ...(tipo === '' ? {} : { kind: [tipo as MovementKind] }),
  }
  const libro = useQuery({
    queryKey: movementListQueryKey(params),
    queryFn: () => fetchMovements(params),
    placeholderData: keepPreviousData,
  })
  const paginas = Math.max(1, Math.ceil((libro.data?.total ?? 0) / POR_PAGINA))

  return (
    <div className="flex flex-col gap-4">
      <MovementFilters
        ingredients={insumos.data ?? []}
        ingredientId={insumo}
        onIngredient={(valor) => {
          setInsumo(valor)
          setPagina(0)
        }}
        kind={tipo}
        onKind={(valor) => {
          setTipo(valor)
          setPagina(0)
        }}
      />
      {libro.isError ? (
        <FormMessage tone="error">
          {errorMessage(libro.error, 'No se pudo cargar el libro de movimientos.')}
        </FormMessage>
      ) : (
        <DataTable
          columns={columns}
          data={libro.data?.items ?? []}
          isLoading={libro.isPending}
          emptyMessage="No hay movimientos con estos filtros."
          getRowId={(mov) => String(mov.id)}
        />
      )}
      {paginas > 1 ? <TablePagination actual={pagina} total={paginas} onChange={setPagina} /> : null}
    </div>
  )
}
