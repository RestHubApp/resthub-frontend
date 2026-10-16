import { zodResolver } from '@hookform/resolvers/zod'
import type { QueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'

import { registerWaste } from '@/api/inventory'
import type { Ingredient, StockChange, WasteApproval } from '@/api/types'
import { wasteApprovalsQueryKey } from '@/api/wasteApprovals'
import { formatMoney, formatQuantity } from '@/services/format'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'
import { saveIngredient } from './ingredientCache'
import { wasteSchema, type WasteValues } from './inventorySchema'
import { findInputUnit, parseDecimal, toBaseQuantity } from './units'

type WasteResult = StockChange | WasteApproval

function isPending(result: WasteResult): result is WasteApproval {
  return !('movement' in result)
}

function successText(ingredient: Ingredient, result: WasteResult): string {
  if (isPending(result)) {
    return `La merma de ${formatMoney(result.value)} supera el monto del local: queda por aprobar. El stock no cambia hasta que la aprueben.`
  }
  return `Merma registrada: ${ingredient.name} queda en ${formatQuantity(result.ingredient.stock, ingredient.unit)}`
}

/** Una merma registrada mueve el insumo; una por aprobar solo suma a la bandeja. */
function updateCache(queryClient: QueryClient, result: WasteResult): void {
  if (isPending(result)) {
    void queryClient.invalidateQueries({ queryKey: wasteApprovalsQueryKey })
    return
  }
  saveIngredient(queryClient, result)
}

/** El estado del formulario de merma: campos, cantidad base que se pierde y envío. */
export function useWasteForm(ingredient: Ingredient, onDone: () => void) {
  const { register, handleSubmit, formState, control } = useForm<WasteValues>({
    resolver: zodResolver(wasteSchema),
    // Una merma suele ser poca cosa: se propone la unidad chica.
    defaultValues: { quantity: '', quantity_unit: ingredient.unit, reason: '' },
  })
  const [quantity, unit] = useWatch({ control, name: ['quantity', 'quantity_unit'] })
  const base = parseDecimal(quantity) * findInputUnit(ingredient.unit, unit).factor

  const waste = useNotifiedMutation({
    mutationFn: (data: WasteValues) =>
      registerWaste({
        ingredient_id: ingredient.id,
        quantity: toBaseQuantity(data.quantity, findInputUnit(ingredient.unit, data.quantity_unit).factor),
        reason: data.reason,
      }),
    success: (result) => successText(ingredient, result),
    updateCache,
    onSuccess: onDone,
  })
  const submit = handleSubmit((data) => {
    waste.mutate(data)
  })

  return { register, submit, errors: formState.errors, base, waste }
}
