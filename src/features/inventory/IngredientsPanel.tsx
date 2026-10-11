import { useMemo, useState } from 'react'

import type { Ingredient } from '@/api/types'
import { DataTable } from '@/components/DataTable'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/api'
import { IngredientFilters } from './IngredientFilters'
import { buildIngredientColumns } from './IngredientColumns'
import type { StockAction } from './StockActionDialog'
import { useIngredients } from './useIngredients'

interface IngredientsPanelProps {
  readonly canManage: boolean
  readonly onAction: (action: StockAction) => void
}

const WITHOUT_INGREDIENTS: readonly Ingredient[] = []

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/** Los insumos con su stock, para buscar, revisar y registrar. */
export function IngredientsPanel({ canManage, onAction }: IngredientsPanelProps) {
  const ingredients = useIngredients()
  const [search, setSearch] = useState('')
  const [isOnlyLow, setIsOnlyLow] = useState(false)
  const all = ingredients.data ?? WITHOUT_INGREDIENTS

  const visible = useMemo(() => {
    const text = normalize(search)
    return all.filter(
      (ingredient) =>
        (!isOnlyLow || ingredient.is_low || ingredient.is_negative) &&
        (text === '' || normalize(ingredient.name).includes(text)),
    )
  }, [all, search, isOnlyLow])
  const cols = useMemo(() => buildIngredientColumns(canManage, onAction), [canManage, onAction])

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
        onlyLow={isOnlyLow}
        onOnlyLow={setIsOnlyLow}
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
