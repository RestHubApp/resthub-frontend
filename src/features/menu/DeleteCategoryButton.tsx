import { deleteCategory } from '../../api/menu'
import type { MenuSection } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useMenuAction } from './useMenuAction'

interface DeleteCategoryButtonProps {
  readonly category: MenuSection
}

/**
 * Borra una categoría vacía.
 *
 * Solo se ofrece sin platos: una categoría con platos se desactiva. Si otra
 * persona le agregó uno mientras tanto, el servidor responde 409 y el aviso
 * lo explica.
 */
export default function DeleteCategoryButton({ category }: DeleteCategoryButtonProps) {
  const borrar = useMenuAction({
    send: () => deleteCategory(category.id),
    failure: `No se pudo eliminar la categoría ${category.name}.`,
    success: `Categoría ${category.name} eliminada.`,
  })

  return (
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="destructive"
          className="h-11 px-3"
          aria-label={`Eliminar la categoría ${category.name}`}
          disabled={borrar.isPending}
        >
          <Icon name="eliminar" size={16} />
          <span>Eliminar</span>
        </Button>
      }
      title={`¿Eliminar ${category.name}?`}
      description="La categoría está vacía y se borra para siempre."
      confirmLabel="Eliminar"
      onConfirm={() => {
        borrar.mutate()
      }}
    />
  )
}
