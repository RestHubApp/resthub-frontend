import { useQuery } from '@tanstack/react-query'

import { permissionsQuery } from '../../api/roles'
import type { Role } from '../../api/types'
import FormDialog from '../../components/FormDialog'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import { errorMessage } from '../../services/api'
import { usePermissions } from '../../store/session'
import { groupPermissions } from './permissionGroups'
import { type RoleAccess, roleAccess } from './roleAccess'
import RoleForm from './RoleForm'

interface RoleFormDialogProps {
  /** `null` crea un rol; un rol, lo edita o lo muestra. */
  readonly role: Role | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

const DESCRIPCIONES: Record<RoleAccess, string> = {
  edit: 'Lo que cambies vale para todas las personas que tienen este rol.',
  fixed: 'El encargado siempre tiene todos los permisos y su rol no se cambia.',
  beyond: 'Tiene permisos que tu cuenta no tiene, así que solo puedes mirarlo.',
}

function titulo(role: Role | null, access: RoleAccess): string {
  if (role === null) {
    return 'Nuevo rol'
  }
  return access === 'edit' ? `Editar ${role.name}` : role.name
}

/** Crear un rol, cambiar sus permisos o, si no se puede cambiar, verlos. */
export default function RoleFormDialog({ role, open, onOpenChange }: RoleFormDialogProps) {
  const granted = usePermissions()
  const catalogo = useQuery({ ...permissionsQuery(), select: groupPermissions, enabled: open })
  const access = role === null ? 'edit' : roleAccess(role, granted)
  const cerrar = () => {
    onOpenChange(false)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={titulo(role, access)}
      description={role === null ? 'Ponle un nombre y elige qué puede hacer quien lo tenga.' : DESCRIPCIONES[access]}
      size="lg"
    >
      {catalogo.isPending ? <ListSkeleton label="Cargando permisos…" count={6} itemClassName="h-11 rounded-lg" /> : null}
      {catalogo.isError ? (
        <FormMessage tone="error">{errorMessage(catalogo.error, 'No se pudieron cargar los permisos.')}</FormMessage>
      ) : null}
      {catalogo.isSuccess ? (
        <RoleForm role={role} groups={catalogo.data} readOnly={access !== 'edit'} onDone={cerrar} />
      ) : null}
    </FormDialog>
  )
}
