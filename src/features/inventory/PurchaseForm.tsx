import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerPurchase } from '../../api/inventory'
import type { Ingredient } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import TextField from '../../components/TextField'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import ChoiceField from './ChoiceField'
import FormButtons from './FormButtons'
import { purchaseSchema, type PurchaseValues } from './inventorySchema'
import { costHint, costLabel, purchaseDefaults, purchaseMath, purchasePayload } from './purchaseMath'
import QuantityField from './QuantityField'
import StockPreview from './StockPreview'
import { formatQuantity, inputUnits, priceUnit } from './units'
import { useInventoryChange } from './useInventoryChange'

interface PurchaseFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

/** Registra una compra: entra stock y se actualiza lo que cuesta el insumo. */
export default function PurchaseForm({ ingredient, onDone }: PurchaseFormProps) {
  const unidades = inputUnits(ingredient.unit)
  const precio = priceUnit(ingredient.unit)
  const { register, handleSubmit, formState, control } = useForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: purchaseDefaults(ingredient),
  })
  const valores = useWatch({ control }) as PurchaseValues
  const cuentas = purchaseMath(valores, ingredient.unit)

  const compra = useInventoryChange({
    send: (datos: PurchaseValues) => registerPurchase(purchasePayload(ingredient.id, datos, ingredient.unit)),
    success: (resultado) =>
      `Compra registrada: ${ingredient.name} queda en ${formatQuantity(resultado.ingredient.stock, ingredient.unit)}.`,
    onDone,
  })
  const errores = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((datos) => {
          compra.mutate(datos)
        }),
      )}
    >
      <QuantityField
        id="purchase-quantity"
        label="Cantidad comprada"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={unidades}
        error={errores.quantity?.message}
      />
      <ChoiceField
        legend="¿Qué costo tienes a la mano?"
        field={register('cost_mode')}
        options={[
          { value: 'unit', label: `Precio por ${precio.label}` },
          { value: 'total', label: 'Total pagado' },
        ]}
      />
      <TextField
        id="purchase-cost"
        label={costLabel(valores.cost_mode, precio.label)}
        icon="costo"
        inputMode="decimal"
        autoComplete="off"
        hint={costHint(cuentas, precio.label)}
        field={register('cost')}
        error={errores.cost?.message}
      />
      <TextField
        id="purchase-reason"
        label="Nota (opcional)"
        placeholder="Mercado mayorista, factura 0012…"
        autoComplete="off"
        field={register('reason')}
        error={errores.reason?.message}
      />
      <StockPreview ingredient={ingredient} delta={cuentas?.baseQuantity ?? null} />

      {compra.isError ? (
        <FormMessage tone="error">
          {errorMessage(compra.error, 'No se pudo registrar la compra.')}
        </FormMessage>
      ) : null}
      <FormButtons label="Registrar compra" icon="compra" pending={compra.isPending} onCancel={onDone} />
    </form>
  )
}
