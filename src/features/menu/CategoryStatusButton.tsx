import { updateCategory } from '@/api/menu'
import type { MenuSection } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { withCategory } from './menuCache'
import { useMenuAction } from './useMenuAction'

interface CategoryStatusButtonProps {
  readonly category: MenuSection
}

/** Oculta una categoría entera de la carta del mesero, o la devuelve. */
export function CategoryStatusButton({ category }: CategoryStatusButtonProps) {
  const status = useMenuAction({
    send: () => updateCategory(category.id, { is_active: !category.is_active }),
    updateCache: withCategory,
    failure: `No se pudo actualizar la categoría ${category.name}.`,
  })
  const change = () => {
    status.mutate()
  }

  const button = (
    <Button
      type="button"
      variant={category.is_active ? 'ghost' : 'success'}
      className="h-11 px-3"
      aria-label={`${category.is_active ? 'Desactivar' : 'Activar'} la categoría ${category.name}`}
      disabled={status.isPending}
      onClick={category.is_active ? undefined : change}
    >
      <Icon name="encender" size={16} />
      <span>{category.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )

  if (!category.is_active) {
    return button
  }
  return (
    <ConfirmDialog
      trigger={button}
      title={`¿Desactivar ${category.name}?`}
      description="La categoría y sus platos dejan de verse en la carta del mesero. No se borra nada: puedes volver a activarla."
      confirmLabel="Desactivar"
      onConfirm={change}
    />
  )
}
