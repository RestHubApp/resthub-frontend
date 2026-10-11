import type { Ingredient } from '@/api/types'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { ChoiceField } from './ChoiceField'
import { FormButtons } from './FormButtons'
import { MutationError } from './MutationError'
import { costHint, costLabel } from './purchaseMath'
import { QuantityField } from './QuantityField'
import { StockPreview } from './StockPreview'
import { inputUnits, priceUnit } from './units'
import { usePurchaseForm } from './usePurchaseForm'

interface PurchaseFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

/** Registra una compra: entra stock y se actualiza lo que cuesta el insumo. */
export function PurchaseForm({ ingredient, onDone }: PurchaseFormProps) {
  const price = priceUnit(ingredient.unit)
  const { register, submit, errors, costMode, accounts, purchase } = usePurchaseForm(ingredient, onDone)

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(submit)}>
      <QuantityField
        id="purchase-quantity"
        label="Cantidad comprada"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={inputUnits(ingredient.unit)}
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

      <MutationError isError={purchase.isError} error={purchase.error} fallback="No se pudo registrar la compra." />
      <FormButtons label="Registrar compra" icon="purchase" pending={purchase.isPending} onCancel={onDone} />
    </form>
  )
}
