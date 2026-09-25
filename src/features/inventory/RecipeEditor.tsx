import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import type { Ingredient, Recipe } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import AddRecipeLine from './AddRecipeLine'
import { recipeSchema, type RecipeValues } from './inventorySchema'
import {
  availableIngredients,
  lineCost,
  recipeCatalog,
  recipeCost,
  recipeValuesOf,
} from './recipeMath'
import RecipeFooter from './RecipeFooter'
import RecipeLineRow from './RecipeLineRow'
import RecipeTotals from './RecipeTotals'
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
export default function RecipeEditor({ recipe, ingredients, canManage }: RecipeEditorProps) {
  const catalogo = recipeCatalog(ingredients, recipe)
  const { register, handleSubmit, formState, control, reset } = useForm<RecipeValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: recipeValuesOf(recipe),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const lineas = useWatch({ control, name: 'lines' })
  const disponibles = availableIngredients(ingredients, lineas, catalogo)

  const guardar = useSaveRecipe(recipe.menu_item_id, (nueva) => {
    reset(recipeValuesOf(nueva))
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          guardar.mutate(valores)
        }),
      )}
    >
      <RecipeTotals price={Number(recipe.price)} cost={recipeCost(lineas, catalogo)} hasLines={lineas.length > 0} />

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
            {fields.map((campo, indice) => {
              const insumo = catalogo.get(campo.ingredient_id)
              return insumo === undefined ? null : (
                <RecipeLineRow
                  key={campo.id}
                  index={indice}
                  ingredient={insumo}
                  field={register(`lines.${String(indice)}.quantity` as `lines.${number}.quantity`)}
                  cost={lineCost(lineas[indice]?.quantity ?? '', insumo)}
                  error={formState.errors.lines?.[indice]?.quantity?.message}
                  readOnly={!canManage}
                  onRemove={() => {
                    remove(indice)
                  }}
                />
              )
            })}
          </ul>
        )}
        {canManage ? (
          <AddRecipeLine
            options={disponibles}
            onAdd={(ingredientId) => {
              append({ ingredient_id: ingredientId, quantity: '' }, { focusName: `lines.${String(fields.length)}.quantity` })
            }}
          />
        ) : null}
      </section>

      {guardar.isError ? (
        <FormMessage tone="error">{errorMessage(guardar.error, 'No se pudo guardar la receta.')}</FormMessage>
      ) : null}
      {canManage ? (
        <RecipeFooter
          empty={lineas.length === 0}
          hadRecipe={recipe.has_recipe}
          dirty={formState.isDirty}
          pending={guardar.isPending}
        />
      ) : null}
    </form>
  )
}
