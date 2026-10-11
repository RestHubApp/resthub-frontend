import type { Ingredient, IngredientUnit } from '@/api/types'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { FormButtons } from './FormButtons'
import { IngredientStockFields } from './IngredientStockFields'
import { IngredientUnitField } from './IngredientUnitField'
import { MutationError } from './MutationError'
import { inputUnits } from './units'
import { useIngredientForm } from './useIngredientForm'

interface IngredientFormProps {
  /** El insumo que se edita. Sin él, se crea uno nuevo. */
  readonly ingredient?: Ingredient
  readonly onDone: () => void
}

/** Alta y edición de un insumo. */
export function IngredientForm({ ingredient, onDone }: IngredientFormProps) {
  const { register, setValue, submit, errors, unit, change } = useIngredientForm(ingredient, onDone)
  const isNew = ingredient === undefined

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(submit)}>
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
      <IngredientStockFields register={register} errors={errors} unit={unit} />

      <MutationError isError={change.isError} error={change.error} fallback="No se pudo guardar el insumo." />
      <FormButtons
        label={isNew ? 'Crear insumo' : 'Guardar'}
        icon={isNew ? 'add' : 'confirm'}
        pending={change.isPending}
        onCancel={onDone}
      />
    </form>
  )
}
