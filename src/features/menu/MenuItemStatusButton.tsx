import { updateMenuItem } from '../../api/menu'
import type { MenuItem } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useMenuAction } from './useMenuAction'

interface MenuItemStatusButtonProps {
  readonly item: MenuItem
}

/**
 * Saca un plato de la carta o lo devuelve.
 *
 * No es lo mismo que "agotado hoy": un plato desactivado desaparece de la
 * carta del mesero hasta que alguien lo vuelva a activar. Por eso se confirma.
 */
export default function MenuItemStatusButton({ item }: MenuItemStatusButtonProps) {
  const estado = useMenuAction({
    send: () => updateMenuItem(item.id, { is_active: !item.is_active }),
    failure: `No se pudo actualizar ${item.name}.`,
  })
  const cambiar = () => {
    estado.mutate()
  }

  const boton = (
    <Button
      type="button"
      variant={item.is_active ? 'ghost' : 'success'}
      className="h-11 px-3"
      disabled={estado.isPending}
      onClick={item.is_active ? undefined : cambiar}
    >
      <Icon name="encender" size={16} />
      <span>{item.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )

  if (!item.is_active) {
    return boton
  }
  return (
    <ConfirmDialog
      trigger={boton}
      title={`¿Sacar ${item.name} de la carta?`}
      description="El mesero deja de verlo hasta que lo vuelvas a activar. Si solo no hay hoy, usa «Disponible hoy»."
      confirmLabel="Desactivar"
      onConfirm={cambiar}
    />
  )
}
