import { updateCategory } from '../../api/menu'
import type { MenuSection } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useMenuAction } from './useMenuAction'

interface CategoryStatusButtonProps {
  readonly category: MenuSection
}

/** Oculta una categoría entera de la carta del mesero, o la devuelve. */
export default function CategoryStatusButton({ category }: CategoryStatusButtonProps) {
  const estado = useMenuAction({
    send: () => updateCategory(category.id, { is_active: !category.is_active }),
    failure: `No se pudo actualizar la categoría ${category.name}.`,
  })
  const cambiar = () => {
    estado.mutate()
  }

  const boton = (
    <Button
      type="button"
      variant={category.is_active ? 'ghost' : 'success'}
      className="h-11 px-3"
      aria-label={`${category.is_active ? 'Desactivar' : 'Activar'} la categoría ${category.name}`}
      disabled={estado.isPending}
      onClick={category.is_active ? undefined : cambiar}
    >
      <Icon name="encender" size={16} />
      <span>{category.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )

  if (!category.is_active) {
    return boton
  }
  return (
    <ConfirmDialog
      trigger={boton}
      title={`¿Desactivar ${category.name}?`}
      description="La categoría y sus platos dejan de verse en la carta del mesero. No se borra nada: puedes volver a activarla."
      confirmLabel="Desactivar"
      onConfirm={cambiar}
    />
  )
}
