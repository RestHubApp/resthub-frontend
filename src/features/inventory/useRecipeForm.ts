import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import type { Ingredient, Recipe } from '@/api/types'
import { recipeSchema, type RecipeValues } from './inventorySchema'
import { availableIngredients, recipeCatalog, recipeValuesOf } from './recipeMath'
import { useSaveRecipe } from './useSaveRecipe'

/**
 * El estado del editor de una receta: líneas, catálogo de insumos y guardado.
 *
 * Al guardar, el formulario parte de la receta como quedó en el servidor.
 */
export function useRecipeForm(recipe: Recipe, ingredients: readonly Ingredient[]) {
  const catalog = recipeCatalog(ingredients, recipe)
  const { register, handleSubmit, formState, control, reset } = useForm<RecipeValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: recipeValuesOf(recipe),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const lines = useWatch({ control, name: 'lines' })
  const save = useSaveRecipe(recipe.menu_item_id, (fresh) => {
    reset(recipeValuesOf(fresh))
  })
  const submit = handleSubmit((values) => {
    save.mutate(values)
  })

  return {
    register,
    submit,
    errors: formState.errors,
    isDirty: formState.isDirty,
    fields,
    append,
    remove,
    lines,
    catalog,
    available: availableIngredients(ingredients, lines, catalog),
    save,
  }
}
