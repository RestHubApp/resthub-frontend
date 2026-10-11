import { Link } from 'react-router'

import type { DishCost } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { Icon } from '@/components/Icon'
import { StatusBadge } from '@/components/StatusBadge'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney, formatPercent } from '@/services/format'
import { paths } from '@/services/paths'

const NUMBER = 'tabular-nums'

function margin(cost: DishCost) {
  if (cost.margin === null) {
    return <StatusBadge label="Sin receta" tone="pending" />
  }
  const isLost = Number(cost.margin) < 0
  return <span className={isLost ? 'font-semibold text-destructive' : 'font-semibold'}>{formatMoney(cost.margin)}</span>
}

/** Las columnas del costo por plato; el enlace a la receta dice Editar o Ver según el permiso. */
export function buildRecipeColumns(canManage: boolean): DataColumn<DishCost>[] {
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
