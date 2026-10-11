import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerWaste } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { FormButtons } from './FormButtons'
import { wasteSchema, type WasteValues } from './inventorySchema'
import { QuantityField } from './QuantityField'
import { StockPreview } from './StockPreview'
import { findInputUnit, inputUnits, parseDecimal, toBaseQuantity } from './units'
import { useInventoryChange } from './useInventoryChange'
import { formatQuantity } from '@/services/format'

interface WasteFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

/**
 * Registra una merma: lo que se botó, se malogró o se devolvió.
 *
 * El motivo es obligatorio y en texto libre: es lo que después explica por qué
 * se pierde plata y qué conviene cambiar.
 */
export function WasteForm({ ingredient, onDone }: WasteFormProps) {
  const units = inputUnits(ingredient.unit)
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
  const errors = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((data) => {
          waste.mutate(data)
        }),
      )}
    >
      <QuantityField
        id="waste-quantity"
        label="Cantidad perdida"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={units}
        error={errors.quantity?.message}
      />
      <TextareaField
        id="waste-reason"
        label="Motivo"
        rows={2}
        placeholder="Se venció, se quemó en la plancha, lo devolvió un cliente…"
        hint="Con tus palabras. Sirve para ver después por qué se pierde."
        field={register('reason')}
        error={errors.reason?.message}
      />
      <StockPreview ingredient={ingredient} delta={base > 0 ? -base : null} />

      {waste.isError ? (
        <FormMessage tone="error">
          {errorMessage(waste.error, 'No se pudo registrar la merma.')}
        </FormMessage>
      ) : null}
      <FormButtons label="Registrar merma" icon="merma" pending={waste.isPending} onCancel={onDone} />
    </form>
  )
}
