import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router'

import { fetchRecipe, recipeQueryKey } from '../../api/inventory'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { buttonVariants } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { useCan } from '../../store/session'
import RecipeEditor from './RecipeEditor'
import { useIngredients } from './useIngredients'

const RECETAS = '/inventario?vista=recetas'

/** A dónde vuelve "Volver": al menú si se llegó desde un plato, si no a las recetas. */
function regreso(estado: unknown): { readonly to: string; readonly label: string } {
  const desde = (estado as { from?: unknown } | null)?.from
  return desde === '/menu' ? { to: '/menu', label: 'Volver al menú' } : { to: RECETAS, label: 'Volver a recetas' }
}

/** La receta de un plato, en su propia dirección para poder enlazarla desde el menú. */
export default function RecipeEditorView() {
  const menuItemId = Number(useParams().menuItemId)
  const volver = regreso(useLocation().state)
  const canManage = useCan('inventory.manage')
  const receta = useQuery({
    queryKey: recipeQueryKey(menuItemId),
    queryFn: () => fetchRecipe(menuItemId),
    enabled: Number.isInteger(menuItemId),
    // El editor parte de lo que hay en el servidor, no de una copia vieja.
    staleTime: 0,
  })
  const insumos = useIngredients()
  const error = receta.error ?? insumos.error
  const cargando = error === null && (receta.data === undefined || insumos.data === undefined)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={receta.data === undefined ? 'Receta' : `Receta: ${receta.data.menu_item_name}`}
        description="Lo que lleva una porción, en la unidad de cada insumo. El costo usa el costo actual de cada insumo."
        actions={
          <Link to={volver.to} className={buttonVariants({ variant: 'outline', className: 'h-11 px-4' })}>
            <Icon name="anterior" size={16} />
            <span>{volver.label}</span>
          </Link>
        }
      />
      {error === null ? null : (
        <FormMessage tone="error">{errorMessage(error, 'No se pudo cargar la receta.')}</FormMessage>
      )}
      {cargando ? <EmptyState title="Cargando la receta…" /> : null}
      {receta.data !== undefined && insumos.data !== undefined ? (
        <RecipeEditor
          key={menuItemId}
          recipe={receta.data}
          ingredients={insumos.data}
          canManage={canManage}
        />
      ) : null}
    </div>
  )
}
