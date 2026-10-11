import { useQuery } from '@tanstack/react-query'

import { dishCostsQuery } from '@/api/inventory'
import { DataTable } from '@/components/DataTable'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/apiError'
import { buildRecipeColumns } from './RecipeColumns'

interface RecipesPanelProps {
  readonly canManage: boolean
}

function noticeWithoutRecipe(quantity: number): string {
  if (quantity === 0) {
    return ''
  }
  const subject = quantity === 1 ? '1 plato no tiene' : `${String(quantity)} platos no tienen`
  return ` ${subject} receta: al venderse no descuentan stock.`
}

/** Cuánto cuesta preparar cada plato y cuánto deja, según su receta. */
export function RecipesPanel({ canManage }: RecipesPanelProps) {
  const costs = useQuery(dishCostsQuery)

  if (costs.isError) {
    return (
      <FormMessage tone="error">
        {errorMessage(costs.error, 'No se pudieron cargar las recetas.')}
      </FormMessage>
    )
  }
  const withoutRecipe = (costs.data ?? []).filter((cost) => !cost.has_recipe).length

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-muted-foreground">
        El costo suma los insumos de una porción a su costo actual. Margen = precio − costo.
        {noticeWithoutRecipe(withoutRecipe)}
      </p>
      <DataTable
        columns={buildRecipeColumns(canManage)}
        data={costs.data ?? []}
        isLoading={costs.isPending}
        emptyMessage="Todavía no hay platos en la carta."
        getRowId={(cost) => String(cost.menu_item_id)}
      />
    </div>
  )
}
