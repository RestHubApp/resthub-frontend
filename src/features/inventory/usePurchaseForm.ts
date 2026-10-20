import { zodResolver } from '@hookform/resolvers/zod'
import { useWatch } from 'react-hook-form'

import { registerPurchase } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { useAppForm } from '@/hooks/useAppForm'
import { formatQuantity } from '@/services/format'
import { purchaseSchema, type PurchaseValues } from './inventorySchema'
import { packageHint, purchaseDefaults, purchaseMath, purchasePayload } from './purchaseMath'
import { useInventoryChange } from './useInventoryChange'

/** El estado del formulario de compra: campos, cuentas en vivo (cantidad base y costo) y envío. */
export function usePurchaseForm(ingredient: Ingredient, onDone: () => void) {
  const { register, handleSubmit, formState, control } = useAppForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: purchaseDefaults(ingredient),
  })
  const values = useWatch({ control }) as PurchaseValues
  const accounts = purchaseMath(values, ingredient)

  const purchase = useInventoryChange({
    send: (data: PurchaseValues) => registerPurchase(purchasePayload(data, ingredient)),
    success: (result) =>
      `Compra registrada: ${ingredient.name} queda en ${formatQuantity(result.ingredient.stock, ingredient.unit)}`,
    onDone,
  })
  const submit = handleSubmit((data) => {
    purchase.mutate(data)
  })

  return { register, submit, errors: formState.errors, costMode: values.cost_mode, accounts, hint: packageHint(values, ingredient), purchase }
}
