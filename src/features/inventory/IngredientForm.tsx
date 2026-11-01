import type { Ingredient, IngredientUnit } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { TextField } from '@/components/TextField'
import * as icons from '@/components/icons'
import { onSubmit } from '@/hooks/formSubmit'
import { InventoryFailure } from './InventoryFailure'
import { IngredientPackagingFields } from './IngredientPackagingFields'
import { IngredientStockFields } from './IngredientStockFields'
import { IngredientUnitField } from './IngredientUnitField'
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
            const units = inputUnits(event.target.value)
            setValue('min_stock_unit', units[0]?.value ?? '')
            setValue('packaging_size_unit', units.at(-1)?.value ?? '')
          },
        })}
        error={errors.unit?.message}
      />
      <IngredientStockFields register={register} errors={errors} unit={unit} />
      <IngredientPackagingFields register={register} errors={errors} unit={unit} />

      <InventoryFailure mutation={change} fallback="No se pudo guardar el insumo." />
      <FormFooter
        mutation={change}
        onCancel={onDone}
        submit={{ label: isNew ? 'Crear insumo' : 'Guardar', icon: isNew ? icons.add : icons.confirm }}
      />
    </form>
  )
}
