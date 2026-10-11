import { Link } from 'react-router'

import type { DishCost } from '@/api/types'
import { Icon } from '@/components/Icon'
import { formatMoney, formatPercent } from '@/services/format'
import { paths } from '@/services/paths'

interface DishMarginProps {
  readonly itemId: number
  readonly itemName: string
  /** Sin dato todavía (cargando o plato recién creado), no se muestra nada. */
  readonly cost: DishCost | undefined
}

// El editor de recetas vuelve a donde se lo abrió.
const FROM_MENU = { from: paths.menu } as const

const LINK =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * El margen del plato según su receta, y el camino a la receta.
 *
 * Un margen negativo se marca: el plato se vende por debajo de lo que cuesta.
 */
export function DishMargin({ itemId, itemName, cost }: DishMarginProps) {
  if (cost === undefined) {
    return null
  }
  const destination = paths.inventory.recipe(itemId)

  if (!cost.has_recipe || cost.margin === null || cost.cost === null) {
    return (
      <p className="m-0 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <span>Sin receta: no se conoce su costo.</span>
        <Link to={destination} state={FROM_MENU} className={LINK} aria-label={`Agregar la receta de ${itemName}`}>
          <Icon name="recipe" size={16} />
          <span>Agregar receta</span>
        </Link>
      </p>
    )
  }

  const isLost = Number(cost.margin) < 0
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      <span>
        Costo {formatMoney(cost.cost)} · Margen{' '}
        <strong className={isLost ? 'text-destructive' : 'text-foreground'}>
          {formatMoney(cost.margin)}
          {cost.margin_percent === null ? '' : ` (${formatPercent(cost.margin_percent)})`}
        </strong>
        {isLost ? ' · se vende a pérdida' : ''}
      </span>
      <Link to={destination} state={FROM_MENU} className={LINK} aria-label={`Ver la receta de ${itemName}`}>
        <Icon name="recipe" size={16} />
        <span>Receta</span>
      </Link>
    </p>
  )
}
