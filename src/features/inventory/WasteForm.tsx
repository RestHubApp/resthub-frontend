import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerWaste } from '../../api/inventory'
import type { Ingredient } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import TextareaField from '../../components/TextareaField'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import FormButtons from './FormButtons'
import { wasteSchema, type WasteValues } from './inventorySchema'
import QuantityField from './QuantityField'
import StockPreview from './StockPreview'
import { findInputUnit, formatQuantity, inputUnits, parseDecimal, toBaseQuantity } from './units'
import { useInventoryChange } from './useInventoryChange'

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
export default function WasteForm({ ingredient, onDone }: WasteFormProps) {
  const unidades = inputUnits(ingredient.unit)
  const { register, handleSubmit, formState, control } = useForm<WasteValues>({
    resolver: zodResolver(wasteSchema),
    // Una merma suele ser poca cosa: se propone la unidad chica.
    defaultValues: { quantity: '', quantity_unit: ingredient.unit, reason: '' },
  })
  const [cantidad, unidad] = useWatch({ control, name: ['quantity', 'quantity_unit'] })
  const base = parseDecimal(cantidad) * findInputUnit(ingredient.unit, unidad).factor

  const merma = useInventoryChange({
    send: (datos: WasteValues) =>
      registerWaste({
        ingredient_id: ingredient.id,
        quantity: toBaseQuantity(datos.quantity, findInputUnit(ingredient.unit, datos.quantity_unit).factor),
        reason: datos.reason,
      }),
    success: (resultado) =>
      `Merma registrada: ${ingredient.name} queda en ${formatQuantity(resultado.ingredient.stock, ingredient.unit)}`,
    onDone,
  })
  const errores = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((datos) => {
          merma.mutate(datos)
        }),
      )}
    >
      <QuantityField
        id="waste-quantity"
        label="Cantidad perdida"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={unidades}
        error={errores.quantity?.message}
      />
      <TextareaField
        id="waste-reason"
        label="Motivo"
        rows={2}
        placeholder="Se venció, se quemó en la plancha, lo devolvió un cliente…"
        hint="Con tus palabras. Sirve para ver después por qué se pierde."
        field={register('reason')}
        error={errores.reason?.message}
      />
      <StockPreview ingredient={ingredient} delta={base > 0 ? -base : null} />

      {merma.isError ? (
        <FormMessage tone="error">
          {errorMessage(merma.error, 'No se pudo registrar la merma.')}
        </FormMessage>
      ) : null}
      <FormButtons label="Registrar merma" icon="merma" pending={merma.isPending} onCancel={onDone} />
    </form>
  )
}
