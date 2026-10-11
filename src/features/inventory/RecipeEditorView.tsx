import { useLocation, useParams } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { BackToLink } from './BackToLink'
import { MutationError } from './MutationError'
import { RecipeEditor } from './RecipeEditor'
import { useRecipeEditorData } from './useRecipeEditorData'

/** A dónde vuelve "Volver": al menú si se llegó desde un plato, si no a las recetas. */
function returnFocus(status: unknown): { readonly to: string; readonly label: string } {
  const from = (status as { from?: unknown } | null)?.from
  return from === paths.menu ? { to: paths.menu, label: 'Volver al menú' } : { to: paths.inventory.recipes, label: 'Volver a recetas' }
}

/** La receta de un plato, en su propia dirección para poder enlazarla desde el menú. */
export function RecipeEditorView() {
  const menuItemId = Number(useParams()['menuItemId'])
  const back = returnFocus(useLocation().state)
  const canManage = useCan(PERMISSION.inventoryManage)
  const { recipe, ingredients, error, isLoading } = useRecipeEditorData(menuItemId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={recipe === undefined ? 'Receta' : `Receta: ${recipe.menu_item_name}`}
        description="Lo que lleva una porción, en la unidad de cada insumo. El costo usa el costo actual de cada insumo."
        actions={<BackToLink to={back.to} label={back.label} />}
      />
      <MutationError isError={error !== null} error={error} fallback="No se pudo cargar la receta." />
      {isLoading ? <EmptyState title="Cargando la receta…" /> : null}
      {recipe !== undefined && ingredients !== undefined ? (
        <RecipeEditor key={menuItemId} recipe={recipe} ingredients={ingredients} canManage={canManage} />
      ) : null}
    </div>
  )
}
