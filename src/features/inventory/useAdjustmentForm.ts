import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerAdjustment } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { formatQuantity, formatSignedQuantity } from '@/services/format'
import { adjustmentDelta, adjustmentPayload } from './adjustmentMath'
import { adjustmentSchema, type AdjustmentValues } from './inventorySchema'
import { inputUnits } from './units'
import { useInventoryChange } from './useInventoryChange'

/**
 * El estado del formulario de ajuste: campos, diferencia calculada y envío.
 *
 * Lo habitual es contar lo que hay; la diferencia con el stock se calcula
 * en vivo con lo que se escribe.
 */
export function useAdjustmentForm(ingredient: Ingredient, onDone: () => void) {
  const units = inputUnits(ingredient.unit)
  const { register, handleSubmit, formState, control } = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      mode: 'count',
      quantity: '',
      quantity_unit: units[0]?.value ?? ingredient.unit,
      sign: 'subtract',
      reason: 'Conteo físico',
    },
  })
  const [mode, quantity, quantityUnit, sign] = useWatch({
    control,
    name: ['mode', 'quantity', 'quantity_unit', 'sign'],
  })
  const delta = adjustmentDelta({ mode, quantity, quantity_unit: quantityUnit, sign }, ingredient)

  const adjustment = useInventoryChange({
    send: (data: AdjustmentValues) => registerAdjustment(adjustmentPayload(data, ingredient)),
    success: (result) =>
      `Ajuste de ${formatSignedQuantity(result.movement.quantity, ingredient.unit)}: ${ingredient.name} queda en ${formatQuantity(result.ingredient.stock, ingredient.unit)}`,
    onDone,
  })
  const submit = handleSubmit((data) => {
    adjustment.mutate(data)
  })

  return { register, submit, errors: formState.errors, mode, delta, units, adjustment }
}
