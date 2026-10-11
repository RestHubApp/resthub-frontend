import { useMemo, useState } from 'react'

import type { Ingredient } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/api'
import { IngredientFilters } from './IngredientFilters'
import { IngredientRowActions } from './IngredientRowActions'
import { IngredientStatus } from './IngredientStatus'
import type { StockAction } from './StockActionDialog'
import { formatUnitCost } from './units'
import { useIngredients } from './useIngredients'
import { formatMoney, formatQuantity } from '@/services/format'

interface IngredientsPanelProps {
  readonly canManage: boolean
  readonly onAction: (action: StockAction) => void
}

const NUMBER = 'tabular-nums'
const WITHOUT_INGREDIENTS: readonly Ingredient[] = []

function columns(
  canManage: boolean,
  onAction: (action: StockAction) => void,
): DataColumn<Ingredient>[] {
  const base: DataColumn<Ingredient>[] = [
    { id: 'nombre', header: 'Insumo', cell: (ingredient) => <span className="font-medium">{ingredient.name}</span> },
    {
      id: 'stock',
      header: 'Stock',
      className: NUMBER,
      cell: (ingredient) => (
        <span className={ingredient.is_negative ? 'font-semibold text-destructive' : 'font-semibold'}>
          {formatQuantity(ingredient.stock, ingredient.unit)}
        </span>
      ),
    },
    { id: 'estado', header: 'Estado', cell: (ingredient) => <IngredientStatus ingredient={ingredient} /> },
    { id: 'minimo', header: 'Mínimo', className: NUMBER, cell: (ingredient) => formatQuantity(ingredient.min_stock, ingredient.unit) },
    {
      id: 'costo',
      header: 'Costo',
      className: NUMBER,
      cell: (ingredient) =>
        Number(ingredient.unit_cost) > 0 ? formatUnitCost(ingredient.unit_cost, ingredient.unit) : formatMoney(0),
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
      cell: (ingredient) => <IngredientRowActions ingredient={ingredient} onAction={onAction} />,
    },
  ]
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/** Los insumos con su stock, para buscar, revisar y registrar. */
export function IngredientsPanel({ canManage, onAction }: IngredientsPanelProps) {
  const ingredients = useIngredients()
  const [search, setSearch] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const all = ingredients.data ?? WITHOUT_INGREDIENTS

  const visible = useMemo(() => {
    const text = normalize(search)
    return all.filter(
      (ingredient) =>
        (!onlyLow || ingredient.is_low || ingredient.is_negative) &&
        (text === '' || normalize(ingredient.name).includes(text)),
    )
  }, [all, search, onlyLow])
  const cols = useMemo(() => columns(canManage, onAction), [canManage, onAction])

  if (ingredients.isError) {
    return (
      <FormMessage tone="error">
        {errorMessage(ingredients.error, 'No se pudieron cargar los insumos.')}
      </FormMessage>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <IngredientFilters
        search={search}
        onSearch={setSearch}
        onlyLow={onlyLow}
        onOnlyLow={setOnlyLow}
        shown={visible.length}
        total={all.length}
      />
      <DataTable
        columns={cols}
        data={visible}
        isLoading={ingredients.isPending}
        emptyMessage={all.length === 0 ? 'Todavía no hay insumos.' : 'Ningún insumo coincide con la búsqueda.'}
        getRowId={(ingredient) => String(ingredient.id)}
        pageSize={30}
      />
    </div>
  )
}
