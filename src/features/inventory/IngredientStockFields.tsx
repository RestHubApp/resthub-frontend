import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { IngredientUnit } from '@/api/types'
import { TextField } from '@/components/TextField'
import * as icons from '@/components/icons'
import type { IngredientValues } from './inventorySchema'
import { QuantityField } from './QuantityField'
import { inputUnits, priceUnit } from './units'

interface IngredientStockFieldsProps {
  readonly register: UseFormRegister<IngredientValues>
  readonly errors: FieldErrors<IngredientValues>
  /** La unidad elegida: define en qué se pide el mínimo y el costo. */
  readonly unit: IngredientUnit
}

/** Stock mínimo y costo de un insumo, pedidos en la unidad que se eligió. */
export function IngredientStockFields({ register, errors, unit }: IngredientStockFieldsProps) {
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <QuantityField
        id="ingredient-min"
        label="Stock mínimo"
        hint="Por debajo, aparece en alertas."
        amount={register('min_stock')}
        unit={register('min_stock_unit')}
        units={inputUnits(unit)}
        error={errors.min_stock?.message}
      />
      <TextField
        id="ingredient-cost"
        label={`Costo por ${priceUnit(unit).label} (S/)`}
        icon={icons.cost}
        inputMode="decimal"
        autoComplete="off"
        hint="Cada compra lo recalcula con el promedio ponderado."
        field={register('unit_cost')}
        error={errors.unit_cost?.message}
      />
    </div>
  )
}
