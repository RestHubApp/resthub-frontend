import type { Ingredient, Recipe } from '@/api/types'
import { onSubmit } from '@/hooks/formSubmit'
import { ErrorMessage } from '@/components/ErrorMessage'
import { recipeCost } from './recipeMath'
import { RecipeFooter } from './RecipeFooter'
import { RecipeLinesSection } from './RecipeLinesSection'
import { RecipeTotals } from './RecipeTotals'
import { useRecipeForm } from './useRecipeForm'

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
  const form = useRecipeForm(recipe, ingredients)

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(form.submit)}>
      <RecipeTotals price={Number(recipe.price)} cost={recipeCost(form.lines, form.catalog)} hasLines={form.lines.length > 0} />

      <RecipeLinesSection
        fields={form.fields}
        lines={form.lines}
        catalog={form.catalog}
        available={form.available}
        register={form.register}
        errors={form.errors}
        canManage={canManage}
        onRemove={form.remove}
        onAdd={(ingredientId) => {
          form.append(
            { ingredient_id: ingredientId, quantity: '' },
            { focusName: `lines.${String(form.fields.length)}.quantity` },
          )
        }}
      />

      <ErrorMessage isError={form.save.isError} error={form.save.error} fallback="No se pudo guardar la receta." />
      {canManage ? (
        <RecipeFooter
          empty={form.lines.length === 0}
          hadRecipe={recipe.has_recipe}
          dirty={form.isDirty}
          pending={form.save.isPending}
        />
      ) : null}
    </form>
  )
}
