import type { Ingredient } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { InventoryFailure } from './InventoryFailure'
import { ChoiceField } from './ChoiceField'
import { costHint, costLabel, purchaseUnits } from './purchaseMath'
import { QuantityField } from './QuantityField'
import { StockPreview } from './StockPreview'
import { priceUnit } from './units'
import { usePurchaseForm } from './usePurchaseForm'

interface PurchaseFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

/** Registra una compra: entra stock y se actualiza lo que cuesta el insumo. */
export function PurchaseForm({ ingredient, onDone }: PurchaseFormProps) {
  const price = priceUnit(ingredient.unit)
  const { register, submit, errors, costMode, accounts, hint, purchase } = usePurchaseForm(ingredient, onDone)

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(submit)}>
      <QuantityField
        id="purchase-quantity"
        label="Cantidad comprada"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={purchaseUnits(ingredient)}
        error={errors.quantity?.message}
        hint={hint}
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
        label={costLabel(costMode, price.label)}
        icon="cost"
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

      <InventoryFailure mutation={purchase} fallback="No se pudo registrar la compra." />
      <FormFooter mutation={purchase} onCancel={onDone} submit={{ label: 'Registrar compra', icon: 'purchase' }} />
    </form>
  )
}
