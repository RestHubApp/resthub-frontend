import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerWaste } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { formatQuantity } from '@/services/format'
import { wasteSchema, type WasteValues } from './inventorySchema'
import { findInputUnit, parseDecimal, toBaseQuantity } from './units'
import { useInventoryChange } from './useInventoryChange'

/** El estado del formulario de merma: campos, cantidad base que se pierde y envío. */
export function useWasteForm(ingredient: Ingredient, onDone: () => void) {
  const { register, handleSubmit, formState, control } = useForm<WasteValues>({
    resolver: zodResolver(wasteSchema),
    // Una merma suele ser poca cosa: se propone la unidad chica.
    defaultValues: { quantity: '', quantity_unit: ingredient.unit, reason: '' },
  })
  const [quantity, unit] = useWatch({ control, name: ['quantity', 'quantity_unit'] })
  const base = parseDecimal(quantity) * findInputUnit(ingredient.unit, unit).factor

  const waste = useInventoryChange({
    send: (data: WasteValues) =>
      registerWaste({
        ingredient_id: ingredient.id,
        quantity: toBaseQuantity(data.quantity, findInputUnit(ingredient.unit, data.quantity_unit).factor),
        reason: data.reason,
      }),
    success: (result) =>
      `Merma registrada: ${ingredient.name} queda en ${formatQuantity(result.ingredient.stock, ingredient.unit)}`,
    onDone,
  })
  const submit = handleSubmit((data) => {
    waste.mutate(data)
  })

  return { register, submit, errors: formState.errors, base, waste }
}
