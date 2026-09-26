import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { rolesQuery } from '../../api/roles'
import type { Role } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import { errorMessage } from '../../services/api'
import { usePermissions } from '../../store/session'
import { roleOptions } from './roleOptions'

interface RoleOptionsGateProps {
  /** Al editar, el rol que la cuenta ya tiene. */
  readonly currentRoleId?: number
  /** El formulario, con los roles que se pueden ofrecer. */
  readonly children: (options: readonly Role[]) => ReactNode
}

/**
 * Espera los roles del restaurante antes de armar el formulario.
 *
 * Así el alta ya abre con el mesero elegido y la edición con el rol actual,
 * en vez de cambiar la lista bajo el dedo cuando llegan.
 */
export default function RoleOptionsGate({ currentRoleId, children }: RoleOptionsGateProps) {
  const roles = useQuery(rolesQuery())
  const granted = usePermissions()

  if (roles.isPending) {
    return <ListSkeleton label="Cargando roles…" count={4} itemClassName="h-10 rounded-lg" />
  }
  if (roles.isError) {
    return <FormMessage tone="error">{errorMessage(roles.error, 'No se pudieron cargar los roles.')}</FormMessage>
  }
  const options = roleOptions(roles.data, granted, currentRoleId)
  if (options.length === 0) {
    return (
      <FormMessage tone="error">
        Todos los roles tienen permisos que tu cuenta no tiene, así que no puedes dar ninguno.
      </FormMessage>
    )
  }
  return <>{children(options)}</>
}
