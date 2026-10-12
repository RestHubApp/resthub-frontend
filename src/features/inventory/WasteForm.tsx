import type { Ingredient } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { QuantityField } from './QuantityField'
import { StockPreview } from './StockPreview'
import { inputUnits } from './units'
import { useWasteForm } from './useWasteForm'

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
  const { register, submit, errors, base, waste } = useWasteForm(ingredient, onDone)

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(submit)}>
      <QuantityField
        id="waste-quantity"
        label="Cantidad perdida"
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={inputUnits(ingredient.unit)}
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

      <FormFooter mutation={waste} failureText="No se pudo registrar la merma." onCancel={onDone} submit={{ label: 'Registrar merma', icon: 'waste' }} />
    </form>
  )
}
