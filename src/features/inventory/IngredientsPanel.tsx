import { useMemo, useState } from 'react'

import type { Ingredient } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import FormMessage from '../../components/FormMessage'
import { errorMessage } from '../../services/api'
import IngredientFilters from './IngredientFilters'
import IngredientRowActions from './IngredientRowActions'
import IngredientStatus from './IngredientStatus'
import type { StockAction } from './StockActionDialog'
import { formatUnitCost } from './units'
import { useIngredients } from './useIngredients'
import { formatMoney, formatQuantity } from '../../services/format'

interface IngredientsPanelProps {
  readonly canManage: boolean
  readonly onAction: (action: StockAction) => void
}

const NUMERO = 'tabular-nums'
const SIN_INSUMOS: readonly Ingredient[] = []

function columnas(
  canManage: boolean,
  onAction: (action: StockAction) => void,
): DataColumn<Ingredient>[] {
  const base: DataColumn<Ingredient>[] = [
    { id: 'nombre', header: 'Insumo', cell: (insumo) => <span className="font-medium">{insumo.name}</span> },
    {
      id: 'stock',
      header: 'Stock',
      className: NUMERO,
      cell: (insumo) => (
        <span className={insumo.is_negative ? 'font-semibold text-destructive' : 'font-semibold'}>
          {formatQuantity(insumo.stock, insumo.unit)}
        </span>
      ),
    },
    { id: 'estado', header: 'Estado', cell: (insumo) => <IngredientStatus ingredient={insumo} /> },
    { id: 'minimo', header: 'Mínimo', className: NUMERO, cell: (insumo) => formatQuantity(insumo.min_stock, insumo.unit) },
    {
      id: 'costo',
      header: 'Costo',
      className: NUMERO,
      cell: (insumo) =>
        Number(insumo.unit_cost) > 0 ? formatUnitCost(insumo.unit_cost, insumo.unit) : formatMoney(0),
    },
  ]
  if (!canManage) {
    return base
  }
  return [
    ...base,
    {
      id: 'acciones',
      header: 'Acciones',
      cell: (insumo) => <IngredientRowActions ingredient={insumo} onAction={onAction} />,
    },
  ]
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/** Los insumos con su stock, para buscar, revisar y registrar. */
export default function IngredientsPanel({ canManage, onAction }: IngredientsPanelProps) {
  const insumos = useIngredients()
  const [busqueda, setBusqueda] = useState('')
  const [soloBajos, setSoloBajos] = useState(false)
  const todos = insumos.data ?? SIN_INSUMOS

  const visibles = useMemo(() => {
    const texto = normalizar(busqueda)
    return todos.filter(
      (insumo) =>
        (!soloBajos || insumo.is_low || insumo.is_negative) &&
        (texto === '' || normalizar(insumo.name).includes(texto)),
    )
  }, [todos, busqueda, soloBajos])
  const cols = useMemo(() => columnas(canManage, onAction), [canManage, onAction])

  if (insumos.isError) {
    return (
      <FormMessage tone="error">
        {errorMessage(insumos.error, 'No se pudieron cargar los insumos.')}
      </FormMessage>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <IngredientFilters
        search={busqueda}
        onSearch={setBusqueda}
        onlyLow={soloBajos}
        onOnlyLow={setSoloBajos}
        shown={visibles.length}
        total={todos.length}
      />
      <DataTable
        columns={cols}
        data={visibles}
        isLoading={insumos.isPending}
        emptyMessage={todos.length === 0 ? 'Todavía no hay insumos.' : 'Ningún insumo coincide con la búsqueda.'}
        getRowId={(insumo) => String(insumo.id)}
        pageSize={30}
      />
    </div>
  )
}
