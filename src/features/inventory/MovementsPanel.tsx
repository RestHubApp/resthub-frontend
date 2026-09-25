import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchMovements, movementListQueryKey } from '../../api/inventory'
import type { Movement, MovementKind, MovementListParams } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import FormMessage from '../../components/FormMessage'
import StatusBadge from '../../components/StatusBadge'
import TablePagination from '../../components/TablePagination'
import { errorMessage } from '../../services/api'
import MovementFilters from './MovementFilters'
import { KIND_TONES } from './movementKinds'
import { formatSignedQuantity, formatUnitCost } from './units'
import { useIngredients } from './useIngredients'

const POR_PAGINA = 20
const FECHA = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' })

const COLUMNAS: DataColumn<Movement>[] = [
  { id: 'fecha', header: 'Fecha', className: 'tabular-nums', cell: (mov) => FECHA.format(new Date(mov.created_at)) },
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
    cell: (mov) => (mov.order_id === null ? mov.reason : `Pedido #${String(mov.order_id)}`) || '—',
  },
]

/** El libro de movimientos: cada entrada y salida de stock, la más reciente primero. */
export default function MovementsPanel() {
  const insumos = useIngredients()
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
          columns={COLUMNAS}
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
