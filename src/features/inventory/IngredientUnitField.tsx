import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Ingredient } from '../../api/types'
import SelectField from '../../components/SelectField'
import { NativeSelectOption } from '../../components/ui/native-select'
import { UNIT_OPTIONS } from './units'

interface IngredientUnitFieldProps {
  /** El insumo que se edita: su unidad se muestra y no se cambia. */
  readonly ingredient: Ingredient | undefined
  readonly field: UseFormRegisterReturn
  readonly error?: string
}

/**
 * Cómo se mide un insumo.
 *
 * Se elige al crearlo y después no cambia: el libro de movimientos entero
 * está escrito en esa unidad.
 */
export default function IngredientUnitField({ ingredient, field, error }: IngredientUnitFieldProps) {
  if (ingredient !== undefined) {
    return (
      <p className="m-0 text-sm text-muted-foreground">
        Se mide en <strong className="text-foreground">{ingredient.unit_label}</strong>. La unidad
        no se cambia: el historial está escrito en ella.
      </p>
    )
  }
  return (
    <SelectField
      id="ingredient-unit"
      label="Cómo se mide"
      hint="No se puede cambiar después."
      field={field}
      error={error}
    >
      {UNIT_OPTIONS.map((opcion) => (
        <NativeSelectOption key={opcion.value} value={opcion.value}>
          {opcion.label}
        </NativeSelectOption>
      ))}
    </SelectField>
  )
}
