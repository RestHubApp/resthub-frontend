import type { Ingredient } from '@/api/types'
import { SelectField } from '@/components/SelectField'
import { TextField } from '@/components/TextField'
import { NativeSelectOption } from '@/components/ui/native-select'
import { onSubmit } from '@/hooks/formSubmit'
import { ChoiceField } from './ChoiceField'
import { FormButtons } from './FormButtons'
import { MutationError } from './MutationError'
import { QuantityField } from './QuantityField'
import { StockPreview } from './StockPreview'
import { useAdjustmentForm } from './useAdjustmentForm'

interface AdjustmentFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

const MODES = [
  { value: 'count', label: 'Conté lo que hay' },
  { value: 'difference', label: 'Sé cuánto sobra o falta' },
] as const

/**
 * Corrige el stock para que coincida con la realidad.
 *
 * Lo habitual es contar lo que hay en la despensa y escribirlo: el sistema
 * calcula la diferencia. Si ya se sabe la diferencia, se escribe directo.
 */
export function AdjustmentForm({ ingredient, onDone }: AdjustmentFormProps) {
  const { register, submit, errors, mode, delta, units, adjustment } = useAdjustmentForm(ingredient, onDone)

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(submit)}
    >
      <ChoiceField legend="¿Qué sabes?" field={register('mode')} options={MODES} />
      {mode === 'difference' ? (
        <SelectField id="adjustment-sign" label="La diferencia" field={register('sign')}>
          <NativeSelectOption value="subtract">Falta: restar del stock</NativeSelectOption>
          <NativeSelectOption value="add">Sobra: sumar al stock</NativeSelectOption>
        </SelectField>
      ) : null}
      <QuantityField
        id="adjustment-quantity"
        label={mode === 'count' ? 'Stock contado' : 'Cantidad de la diferencia'}
        amount={register('quantity')}
        unit={register('quantity_unit')}
        units={units}
        error={errors.quantity?.message}
      />
      <TextField
        id="adjustment-reason"
        label="Motivo"
        autoComplete="off"
        field={register('reason')}
        error={errors.reason?.message}
      />
      <StockPreview ingredient={ingredient} delta={delta} />

      <MutationError
        isError={adjustment.isError}
        error={adjustment.error}
        fallback="No se pudo registrar el ajuste."
      />
      <FormButtons label="Guardar ajuste" icon="count" pending={adjustment.isPending} onCancel={onDone} />
    </form>
  )
}
