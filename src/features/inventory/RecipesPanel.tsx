import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { dishCostsQuery } from '@/api/inventory'
import type { DishCost } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { StatusBadge } from '@/components/StatusBadge'
import { buttonVariants } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { formatMoney, formatPercent } from '@/services/format'
import { paths } from '@/services/paths'

interface RecipesPanelProps {
  readonly canManage: boolean
}

const NUMBER = 'tabular-nums'

function margin(cost: DishCost) {
  if (cost.margin === null) {
    return <StatusBadge label="Sin receta" tone="pending" />
  }
  const isLost = Number(cost.margin) < 0
  return <span className={isLost ? 'font-semibold text-destructive' : 'font-semibold'}>{formatMoney(cost.margin)}</span>
}

function columns(canManage: boolean): DataColumn<DishCost>[] {
  return [
    {
      id: 'plato',
      header: 'Plato',
      cell: (cost) => (
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {cost.menu_item_name}
          {cost.is_active ? null : <StatusBadge label="Fuera de la carta" />}
        </span>
      ),
    },
    { id: 'precio', header: 'Precio', className: NUMBER, cell: (cost) => formatMoney(cost.price) },
    { id: 'costo', header: 'Costo', className: NUMBER, cell: (cost) => (cost.cost === null ? '—' : formatMoney(cost.cost)) },
    { id: 'margen', header: 'Margen', className: NUMBER, cell: margin },
    {
      id: 'porcentaje',
      header: '% margen',
      className: NUMBER,
      cell: (cost) => (cost.margin_percent === null ? '—' : formatPercent(cost.margin_percent)),
    },
    {
      id: 'receta',
      header: 'Receta',
      cell: (cost) => {
        const verb = canManage ? 'Editar' : 'Ver'
        const text = cost.has_recipe ? `${verb} receta` : 'Crear receta'
        return (
          <Link
            to={paths.inventory.recipe(cost.menu_item_id)}
            className={buttonVariants({ variant: cost.has_recipe ? 'outline' : 'secondary', className: 'h-11 px-3' })}
            aria-label={`${text} de ${cost.menu_item_name}`}
          >
            <Icon name="recipe" size={16} />
            <span>{text}</span>
          </Link>
        )
      },
    },
  ]
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
        columns={columns(canManage)}
        data={costs.data ?? []}
        isLoading={costs.isPending}
        emptyMessage="Todavía no hay platos en la carta."
        getRowId={(cost) => String(cost.menu_item_id)}
      />
    </div>
  )
}
