import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import type { Ingredient, Recipe } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { AddRecipeLine } from './AddRecipeLine'
import { recipeSchema, type RecipeValues } from './inventorySchema'
import {
  availableIngredients,
  lineCost,
  recipeCatalog,
  recipeCost,
  recipeValuesOf,
} from './recipeMath'
import { RecipeFooter } from './RecipeFooter'
import { RecipeLineRow } from './RecipeLineRow'
import { RecipeTotals } from './RecipeTotals'
import { useSaveRecipe } from './useSaveRecipe'

interface RecipeEditorProps {
  readonly recipe: Recipe
  readonly ingredients: readonly Ingredient[]
  readonly canManage: boolean
}

/**
 * Los insumos de una porción, con el costo y el margen en vivo.
 *
 * Se guarda la receta entera de una vez (PUT): lo que se ve es lo que queda.
 * Sin ningún insumo, guardar borra la receta.
 */
export function RecipeEditor({ recipe, ingredients, canManage }: RecipeEditorProps) {
  const catalog = recipeCatalog(ingredients, recipe)
  const { register, handleSubmit, formState, control, reset } = useForm<RecipeValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: recipeValuesOf(recipe),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const lines = useWatch({ control, name: 'lines' })
  const available = availableIngredients(ingredients, lines, catalog)

  const save = useSaveRecipe(recipe.menu_item_id, (fresh) => {
    reset(recipeValuesOf(fresh))
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          save.mutate(values)
        }),
      )}
    >
      <RecipeTotals price={Number(recipe.price)} cost={recipeCost(lines, catalog)} hasLines={lines.length > 0} />

      <section aria-labelledby="receta-insumos" className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 sm:p-5">
        <h2 id="receta-insumos" className="m-0 font-heading text-lg font-semibold">
          Insumos por porción
        </h2>
        {fields.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">
            Sin insumos. Agrega lo que lleva una porción, en la unidad de cada insumo.
          </p>
        ) : (
          <ul className="m-0 list-none divide-y p-0">
            {fields.map((field, index) => {
              const ingredient = catalog.get(field.ingredient_id)
              return ingredient === undefined ? null : (
                <RecipeLineRow
                  key={field.id}
                  index={index}
                  ingredient={ingredient}
                  field={register(`lines.${String(index)}.quantity` as `lines.${number}.quantity`)}
                  cost={lineCost(lines[index]?.quantity ?? '', ingredient)}
                  error={formState.errors.lines?.[index]?.quantity?.message}
                  readOnly={!canManage}
                  onRemove={() => {
                    remove(index)
                  }}
                />
              )
            })}
          </ul>
        )}
        {canManage ? (
          <AddRecipeLine
            options={available}
            onAdd={(ingredientId) => {
              append({ ingredient_id: ingredientId, quantity: '' }, { focusName: `lines.${String(fields.length)}.quantity` })
            }}
          />
        ) : null}
      </section>

      {save.isError ? (
        <FormMessage tone="error">{errorMessage(save.error, 'No se pudo guardar la receta.')}</FormMessage>
      ) : null}
      {canManage ? (
        <RecipeFooter
          empty={lines.length === 0}
          hadRecipe={recipe.has_recipe}
          dirty={formState.isDirty}
          pending={save.isPending}
        />
      ) : null}
    </form>
  )
}
