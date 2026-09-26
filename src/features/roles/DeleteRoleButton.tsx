import { deleteRole } from '../../api/roles'
import type { Role } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { removeFromList } from '../../services/cacheList'
import { useRoleMutation } from './useRoleMutation'

interface DeleteRoleButtonProps {
  readonly role: Role
}

/**
 * Borra un rol personalizado que nadie tiene.
 *
 * Solo se ofrece sin personas: si alguien lo recibió mientras tanto, el
 * servidor responde 409 y el aviso lo explica.
 */
export default function DeleteRoleButton({ role }: DeleteRoleButtonProps) {
  const borrar = useRoleMutation({
    mutationFn: () => deleteRole(role.id),
    failure: `No se pudo eliminar el rol ${role.name}.`,
    success: () => `Rol ${role.name} eliminado.`,
    updateCache: (roles) => removeFromList(roles, role.id),
  })

  return (
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="destructive"
          className="h-11 px-3"
          aria-label={`Eliminar el rol ${role.name}`}
          disabled={borrar.isPending}
        >
          <Icon name="eliminar" size={16} />
          <span>Eliminar</span>
        </Button>
      }
      title={`¿Eliminar el rol ${role.name}?`}
      description="Nadie lo tiene y se borra para siempre."
      confirmLabel="Eliminar"
      onConfirm={() => {
        borrar.mutate()
      }}
    />
  )
}
