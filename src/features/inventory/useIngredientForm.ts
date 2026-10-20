import { zodResolver } from '@hookform/resolvers/zod'
import { useWatch } from 'react-hook-form'

import { createIngredient, updateIngredient } from '@/api/inventory'
import type { Ingredient } from '@/api/types'
import { useAppForm } from '@/hooks/useAppForm'
import { EMPTY_INGREDIENT, ingredientNumbers, ingredientValuesOf, packagingRequest } from './ingredientValues'
import { ingredientSchema, type IngredientValues } from './inventorySchema'
import { useInventoryChange } from './useInventoryChange'

function save(ingredient: Ingredient | undefined, values: IngredientValues) {
  const numbers = ingredientNumbers(values, values.unit)
  // Sin envase, ni antes ni ahora, no se manda: en la edición, `null` quita el que tenía.
  const request = packagingRequest(values, values.unit)
  const packaging = request === null && (ingredient?.packaging ?? null) === null ? {} : { packaging: request }
  if (ingredient === undefined) {
    return createIngredient({ name: values.name, unit: values.unit, ...numbers, ...packaging })
  }
  return updateIngredient(ingredient.id, { name: values.name, ...numbers, ...packaging })
}

/** El estado del formulario de un insumo: campos, unidad elegida y envío (alta o edición). */
export function useIngredientForm(ingredient: Ingredient | undefined, onDone: () => void) {
  const { register, handleSubmit, formState, control, setValue } = useAppForm<IngredientValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: ingredient === undefined ? EMPTY_INGREDIENT : ingredientValuesOf(ingredient),
  })
  const unit = useWatch({ control, name: 'unit' })
  const change = useInventoryChange({
    send: (values: IngredientValues) => save(ingredient, values),
    success: (result) => (ingredient === undefined ? `Insumo ${result.name} creado.` : 'Cambios guardados.'),
    onDone,
  })
  const submit = handleSubmit((values) => {
    change.mutate(values)
  })

  return { register, setValue, submit, errors: formState.errors, unit, change }
}
