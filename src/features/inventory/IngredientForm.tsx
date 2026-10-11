import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { createIngredient, updateIngredient } from '@/api/inventory'
import type { Ingredient, IngredientUnit } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { FormButtons } from './FormButtons'
import { IngredientUnitField } from './IngredientUnitField'
import { EMPTY_INGREDIENT, ingredientNumbers, ingredientValuesOf } from './ingredientValues'
import { ingredientSchema, type IngredientValues } from './inventorySchema'
import { QuantityField } from './QuantityField'
import { inputUnits, priceUnit } from './units'
import { useInventoryChange } from './useInventoryChange'

interface IngredientFormProps {
  /** El insumo que se edita. Sin él, se crea uno nuevo. */
  readonly ingredient?: Ingredient
  readonly onDone: () => void
}

function save(ingredient: Ingredient | undefined, values: IngredientValues) {
  const numbers = ingredientNumbers(values, values.unit)
  if (ingredient === undefined) {
    return createIngredient({ name: values.name, unit: values.unit, ...numbers })
  }
  return updateIngredient(ingredient.id, { name: values.name, ...numbers })
}

/** Alta y edición de un insumo. */
export function IngredientForm({ ingredient, onDone }: IngredientFormProps) {
  const { register, handleSubmit, formState, control, setValue } = useForm<IngredientValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: ingredient === undefined ? EMPTY_INGREDIENT : ingredientValuesOf(ingredient),
  })
  const unit = useWatch({ control, name: 'unit' })
  const change = useInventoryChange({
    send: (values: IngredientValues) => save(ingredient, values),
    success: (result) => (ingredient === undefined ? `Insumo ${result.name} creado.` : 'Cambios guardados.'),
    onDone,
  })
  const errors = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          change.mutate(values)
        }),
      )}
    >
      <TextField
        id="ingredient-name"
        label="Nombre"
        placeholder="Limón, pescado bonito, aceite…"
        autoComplete="off"
        field={register('name')}
        error={errors.name?.message}
      />
      <IngredientUnitField
        ingredient={ingredient}
        field={register('unit', {
          onChange: (event: { target: { value: IngredientUnit } }) => {
            setValue('min_stock_unit', inputUnits(event.target.value)[0]?.value ?? '')
          },
        })}
        error={errors.unit?.message}
      />
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <QuantityField
          id="ingredient-min"
          label="Stock mínimo"
          hint="Por debajo, aparece en alertas."
          amount={register('min_stock')}
          unit={register('min_stock_unit')}
          units={inputUnits(unit)}
          error={errors.min_stock?.message}
        />
        <TextField
          id="ingredient-cost"
          label={`Costo por ${priceUnit(unit).label} (S/)`}
          icon="costo"
          inputMode="decimal"
          autoComplete="off"
          hint="Cada compra lo recalcula con el promedio ponderado."
          field={register('unit_cost')}
          error={errors.unit_cost?.message}
        />
      </div>

      {change.isError ? (
        <FormMessage tone="error">
          {errorMessage(change.error, 'No se pudo guardar el insumo.')}
        </FormMessage>
      ) : null}
      <FormButtons
        label={ingredient === undefined ? 'Crear insumo' : 'Guardar'}
        icon={ingredient === undefined ? 'agregar' : 'confirmar'}
        pending={change.isPending}
        onCancel={onDone}
      />
    </form>
  )
}
