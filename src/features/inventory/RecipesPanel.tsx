import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { dishCostsQueryKey, fetchDishCosts } from '../../api/inventory'
import type { DishCost } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import { buttonVariants } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { formatMoney, formatPercent } from '../../services/money'

interface RecipesPanelProps {
  readonly canManage: boolean
}

const NUMERO = 'tabular-nums'

function margen(costo: DishCost) {
  if (costo.margin === null) {
    return <StatusBadge label="Sin receta" tone="pending" />
  }
  const perdida = Number(costo.margin) < 0
  return <span className={perdida ? 'font-semibold text-destructive' : 'font-semibold'}>{formatMoney(costo.margin)}</span>
}

function columnas(canManage: boolean): DataColumn<DishCost>[] {
  return [
    {
      id: 'plato',
      header: 'Plato',
      cell: (costo) => (
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {costo.menu_item_name}
          {costo.is_active ? null : <StatusBadge label="Fuera de la carta" />}
        </span>
      ),
    },
    { id: 'precio', header: 'Precio', className: NUMERO, cell: (costo) => formatMoney(costo.price) },
    { id: 'costo', header: 'Costo', className: NUMERO, cell: (costo) => (costo.cost === null ? '—' : formatMoney(costo.cost)) },
    { id: 'margen', header: 'Margen', className: NUMERO, cell: margen },
    {
      id: 'porcentaje',
      header: '% margen',
      className: NUMERO,
      cell: (costo) => (costo.margin_percent === null ? '—' : formatPercent(costo.margin_percent)),
    },
    {
      id: 'receta',
      header: 'Receta',
      cell: (costo) => {
        const verbo = canManage ? 'Editar' : 'Ver'
        const texto = costo.has_recipe ? `${verbo} receta` : 'Crear receta'
        return (
          <Link
            to={`/inventario/recetas/${String(costo.menu_item_id)}`}
            className={buttonVariants({ variant: costo.has_recipe ? 'outline' : 'secondary', className: 'h-11 px-3' })}
            aria-label={`${texto} de ${costo.menu_item_name}`}
          >
            <Icon name="receta" size={16} />
            <span>{texto}</span>
          </Link>
        )
      },
    },
  ]
}

function avisoSinReceta(cantidad: number): string {
  if (cantidad === 0) {
    return ''
  }
  const sujeto = cantidad === 1 ? '1 plato no tiene' : `${String(cantidad)} platos no tienen`
  return ` ${sujeto} receta: al venderse no descuentan stock.`
}

/** Cuánto cuesta preparar cada plato y cuánto deja, según su receta. */
export default function RecipesPanel({ canManage }: RecipesPanelProps) {
  const costos = useQuery({ queryKey: dishCostsQueryKey, queryFn: fetchDishCosts })

  if (costos.isError) {
    return (
      <FormMessage tone="error">
        {errorMessage(costos.error, 'No se pudieron cargar las recetas.')}
      </FormMessage>
    )
  }
  const sinReceta = (costos.data ?? []).filter((costo) => !costo.has_recipe).length

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-muted-foreground">
        El costo suma los insumos de una porción a su costo actual. Margen = precio − costo.
        {avisoSinReceta(sinReceta)}
      </p>
      <DataTable
        columns={columnas(canManage)}
        data={costos.data ?? []}
        isLoading={costos.isPending}
        emptyMessage="Todavía no hay platos en la carta."
        getRowId={(costo) => String(costo.menu_item_id)}
      />
    </div>
  )
}
