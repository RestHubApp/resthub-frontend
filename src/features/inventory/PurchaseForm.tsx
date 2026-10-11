import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerPurchase } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { ChoiceField } from './ChoiceField'
import { FormButtons } from './FormButtons'
import { purchaseSchema, type PurchaseValues } from './inventorySchema'
import { costHint, costLabel, purchaseDefaults, purchaseMath, purchasePayload } from './purchaseMath'
import { QuantityField } from './QuantityField'
import { StockPreview } from './StockPreview'
import { inputUnits, priceUnit } from './units'
import { useInventoryChange } from './useInventoryChange'
import { formatQuantity } from '@/services/format'

interface PurchaseFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

/** Registra una compra: entra stock y se actualiza lo que cuesta el insumo. */
export function PurchaseForm({ ingredient, onDone }: PurchaseFormProps) {
  const units = inputUnits(ingredient.unit)
  const price = priceUnit(ingredient.unit)
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
  const errors = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((data) => {
          purchase.mutate(data)
        }),
      )}
    >
      <QuantityField
        id="purchase-quantity"
        label="Cantidad comprada"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={units}
        error={errors.quantity?.message}
      />
      <ChoiceField
        legend="¿Qué costo tienes a la mano?"
        field={register('cost_mode')}
        options={[
          { value: 'unit', label: `Precio por ${price.label}` },
          { value: 'total', label: 'Total pagado' },
        ]}
      />
      <TextField
        id="purchase-cost"
        label={costLabel(values.cost_mode, price.label)}
        icon="costo"
        inputMode="decimal"
        autoComplete="off"
        hint={costHint(accounts, price.label)}
        field={register('cost')}
        error={errors.cost?.message}
      />
      <TextField
        id="purchase-reason"
        label="Nota (opcional)"
        placeholder="Mercado mayorista, factura 0012…"
        autoComplete="off"
        field={register('reason')}
        error={errors.reason?.message}
      />
      <StockPreview ingredient={ingredient} delta={accounts?.baseQuantity ?? null} />

      {purchase.isError ? (
        <FormMessage tone="error">
          {errorMessage(purchase.error, 'No se pudo registrar la compra.')}
        </FormMessage>
      ) : null}
      <FormButtons label="Registrar compra" icon="compra" pending={purchase.isPending} onCancel={onDone} />
    </form>
  )
}
