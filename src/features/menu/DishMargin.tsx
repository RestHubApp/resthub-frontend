import { Link } from 'react-router'

import type { DishCost } from '../../api/types'
import Icon from '../../components/Icon'
import { formatMoney, formatPercent } from '../../services/money'

interface DishMarginProps {
  readonly itemId: number
  readonly itemName: string
  /** Sin dato todavía (cargando o plato recién creado), no se muestra nada. */
  readonly cost: DishCost | undefined
}

// El editor de recetas vuelve a donde se lo abrió.
const DESDE_MENU = { from: '/menu' } as const

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * El margen del plato según su receta, y el camino a la receta.
 *
 * Un margen negativo se marca: el plato se vende por debajo de lo que cuesta.
 */
export default function DishMargin({ itemId, itemName, cost }: DishMarginProps) {
  if (cost === undefined) {
    return null
  }
  const destino = `/inventario/recetas/${String(itemId)}`

  if (!cost.has_recipe || cost.margin === null || cost.cost === null) {
    return (
      <p className="m-0 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <span>Sin receta: no se conoce su costo.</span>
        <Link to={destino} state={DESDE_MENU} className={ENLACE} aria-label={`Agregar la receta de ${itemName}`}>
          <Icon name="receta" size={16} />
          <span>Agregar receta</span>
        </Link>
      </p>
    )
  }

  const perdida = Number(cost.margin) < 0
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      <span>
        Costo {formatMoney(cost.cost)} · Margen{' '}
        <strong className={perdida ? 'text-destructive' : 'text-foreground'}>
          {formatMoney(cost.margin)}
          {cost.margin_percent === null ? '' : ` (${formatPercent(cost.margin_percent)})`}
        </strong>
        {perdida ? ' · se vende a pérdida' : ''}
      </span>
      <Link to={destino} state={DESDE_MENU} className={ENLACE} aria-label={`Ver la receta de ${itemName}`}>
        <Icon name="receta" size={16} />
        <span>Receta</span>
      </Link>
    </p>
  )
}
