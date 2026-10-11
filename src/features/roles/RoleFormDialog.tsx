import { useQuery } from '@tanstack/react-query'

import { permissionsQuery } from '@/api/roles'
import type { Role } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { errorMessage } from '@/services/apiError'
import { usePermissions } from '@/store/session'
import { groupPermissions } from './permissionGroups'
import { type RoleAccess, roleAccess } from './roleAccess'
import { RoleForm } from './RoleForm'

interface RoleFormDialogProps {
  /** `null` crea un rol; un rol, lo edita o lo muestra. */
  readonly role: Role | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

const DESCRIPTIONS: Record<RoleAccess, string> = {
  edit: 'Lo que cambies vale para todas las personas que tienen este rol.',
  fixed: 'El encargado siempre tiene todos los permisos y su rol no se cambia.',
  beyond: 'Tiene permisos que tu cuenta no tiene, así que solo puedes mirarlo.',
}

function title(role: Role | null, access: RoleAccess): string {
  if (role === null) {
    return 'Nuevo rol'
  }
  return access === 'edit' ? `Editar ${role.name}` : role.name
}

/** Crear un rol, cambiar sus permisos o, si no se puede cambiar, verlos. */
export function RoleFormDialog({ role, open, onOpenChange }: RoleFormDialogProps) {
  const granted = usePermissions()
  const catalog = useQuery({ ...permissionsQuery(), select: groupPermissions, enabled: open })
  const access = role === null ? 'edit' : roleAccess(role, granted)
  const close = () => {
    onOpenChange(false)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title(role, access)}
      description={role === null ? 'Ponle un nombre y elige qué puede hacer quien lo tenga.' : DESCRIPTIONS[access]}
      size="lg"
    >
      {catalog.isPending ? <ListSkeleton label="Cargando permisos…" count={6} itemClassName="h-11 rounded-lg" /> : null}
      {catalog.isError ? (
        <FormMessage tone="error">{errorMessage(catalog.error, 'No se pudieron cargar los permisos.')}</FormMessage>
      ) : null}
      {catalog.isSuccess ? (
        <RoleForm role={role} groups={catalog.data} readOnly={access !== 'edit'} onDone={close} />
      ) : null}
    </FormDialog>
  )
}
