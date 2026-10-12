import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerPurchase } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { formatQuantity } from '@/services/format'
import { purchaseSchema, type PurchaseValues } from './inventorySchema'
import { purchaseDefaults, purchaseMath, purchasePayload } from './purchaseMath'
import { useInventoryChange } from './useInventoryChange'

/** El estado del formulario de compra: campos, cuentas en vivo (cantidad base y costo) y envío. */
export function usePurchaseForm(ingredient: Ingredient, onDone: () => void) {
  const { register, handleSubmit, formState, control } = useForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: purchaseDefaults(ingredient),
  })
  const values = useWatch({ control }) as PurchaseValues
  const accounts = purchaseMath(values, ingredient.unit)

  const purchase = useInventoryChange({
    send: (data: PurchaseValues) => registerPurchase(purchasePayload(ingredient.id, data, ingredient.unit)),
    success: (result) =>
      `Compra registrada: ${ingredient.name} queda en ${formatQuantity(result.ingredient.stock, ingredient.unit)}`,
    onDone,
  })
  const submit = handleSubmit((data) => {
    purchase.mutate(data)
  })

  return { register, submit, errors: formState.errors, costMode: values.cost_mode, accounts, purchase }
}
