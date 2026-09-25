import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { registerAdjustment } from '../../api/inventory'
import type { Ingredient } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { NativeSelectOption } from '../../components/ui/native-select'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { adjustmentDelta, adjustmentPayload } from './adjustmentMath'
import ChoiceField from './ChoiceField'
import FormButtons from './FormButtons'
import { adjustmentSchema, type AdjustmentValues } from './inventorySchema'
import QuantityField from './QuantityField'
import StockPreview from './StockPreview'
import { formatQuantity, formatSignedQuantity, inputUnits } from './units'
import { useInventoryChange } from './useInventoryChange'

interface AdjustmentFormProps {
  readonly ingredient: Ingredient
  readonly onDone: () => void
}

const MODOS = [
  { value: 'count', label: 'Conté lo que hay' },
  { value: 'difference', label: 'Sé cuánto sobra o falta' },
] as const

/**
 * Corrige el stock para que coincida con la realidad.
 *
 * Lo habitual es contar lo que hay en la despensa y escribirlo: el sistema
 * calcula la diferencia. Si ya se sabe la diferencia, se escribe directo.
 */
export default function AdjustmentForm({ ingredient, onDone }: AdjustmentFormProps) {
  const unidades = inputUnits(ingredient.unit)
  const { register, handleSubmit, formState, control } = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      mode: 'count',
      quantity: '',
      quantity_unit: unidades[0]?.value ?? ingredient.unit,
      sign: 'subtract',
      reason: 'Conteo físico',
    },
  })
  const [mode, quantity, quantityUnit, sign] = useWatch({
    control,
    name: ['mode', 'quantity', 'quantity_unit', 'sign'],
  })
  const delta = adjustmentDelta({ mode, quantity, quantity_unit: quantityUnit, sign }, ingredient)

  const ajuste = useInventoryChange({
    send: (datos: AdjustmentValues) => registerAdjustment(adjustmentPayload(datos, ingredient)),
    success: (resultado) =>
      `Ajuste de ${formatSignedQuantity(resultado.movement.quantity, ingredient.unit)}: ${ingredient.name} queda en ${formatQuantity(resultado.ingredient.stock, ingredient.unit)}.`,
    onDone,
  })
  const errores = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((datos) => {
          ajuste.mutate(datos)
        }),
      )}
    >
      <ChoiceField legend="¿Qué sabes?" field={register('mode')} options={MODOS} />
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
        units={unidades}
        error={errores.quantity?.message}
      />
      <TextField
        id="adjustment-reason"
        label="Motivo"
        autoComplete="off"
        field={register('reason')}
        error={errores.reason?.message}
      />
      <StockPreview ingredient={ingredient} delta={delta} />

      {ajuste.isError ? (
        <FormMessage tone="error">
          {errorMessage(ajuste.error, 'No se pudo registrar el ajuste.')}
        </FormMessage>
      ) : null}
      <FormButtons label="Guardar ajuste" icon="conteo" pending={ajuste.isPending} onCancel={onDone} />
    </form>
  )
}
