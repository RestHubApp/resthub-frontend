import type { Ingredient } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { formatMoney, formatQuantity } from '@/services/format'
import { IngredientRowActions } from './IngredientRowActions'
import { IngredientStatus } from './IngredientStatus'
import type { StockAction } from './StockActionDialog'
import { formatUnitCost } from './units'

const NUMBER = 'tabular-nums'

/** Las columnas de la tabla de insumos; las acciones solo aparecen a quien puede gestionar. */
export function buildIngredientColumns(
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
