import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router'

import { recipeQuery } from '@/api/inventory'
import { PERMISSION } from '@/api/permissions'
import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { RecipeEditor } from './RecipeEditor'
import { useIngredients } from './useIngredients'

/** A dónde vuelve "Volver": al menú si se llegó desde un plato, si no a las recetas. */
function returnValue(status: unknown): { readonly to: string; readonly label: string } {
  const from = (status as { from?: unknown } | null)?.from
  return from === paths.menu ? { to: paths.menu, label: 'Volver al menú' } : { to: paths.inventory.recipes, label: 'Volver a recetas' }
}

/** La receta de un plato, en su propia dirección para poder enlazarla desde el menú. */
export function RecipeEditorView() {
  const menuItemId = Number(useParams()['menuItemId'])
  const back = returnValue(useLocation().state)
  const canManage = useCan(PERMISSION.inventoryManage)
  const recipe = useQuery({
    ...recipeQuery(menuItemId),
    enabled: Number.isInteger(menuItemId),
    // El editor parte de lo que hay en el servidor, no de una copia vieja.
    staleTime: 0,
  })
  const ingredients = useIngredients()
  const error = recipe.error ?? ingredients.error
  const loading = error === null && (recipe.data === undefined || ingredients.data === undefined)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={recipe.data === undefined ? 'Receta' : `Receta: ${recipe.data.menu_item_name}`}
        description="Lo que lleva una porción, en la unidad de cada insumo. El costo usa el costo actual de cada insumo."
        actions={
          <Link to={back.to} className={buttonVariants({ variant: 'outline', className: 'h-11 px-4' })}>
            <Icon name="anterior" size={16} />
            <span>{back.label}</span>
          </Link>
        }
      />
      {error === null ? null : (
        <FormMessage tone="error">{errorMessage(error, 'No se pudo cargar la receta.')}</FormMessage>
      )}
      {loading ? <EmptyState title="Cargando la receta…" /> : null}
      {recipe.data !== undefined && ingredients.data !== undefined ? (
        <RecipeEditor
          key={menuItemId}
          recipe={recipe.data}
          ingredients={ingredients.data}
          canManage={canManage}
        />
      ) : null}
    </div>
  )
}
