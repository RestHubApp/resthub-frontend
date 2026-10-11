import { useQuery } from '@tanstack/react-query'

import { permissionsQuery, rolesQuery } from '@/api/roles'
import type { Role } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { SectionCard } from '@/components/SectionCard'
import { errorMessage } from '@/services/api'
import { usePermissions } from '@/store/session'
import { groupPermissions } from './permissionGroups'
import { roleAccess } from './roleAccess'
import { RoleRow } from './RoleRow'

interface RolesListCardProps {
  readonly onOpen: (role: Role) => void
}

/** La tarjeta con la lista de roles, cada uno con su resumen de permisos. */
export function RolesListCard({ onOpen }: RolesListCardProps) {
  const roles = useQuery(rolesQuery())
  // Solo da nombre a los grupos del resumen: sin él, la lista igual se muestra.
  const catalog = useQuery({ ...permissionsQuery(), select: groupPermissions })
  const granted = usePermissions()
  const list = roles.data ?? []

  return (
    <SectionCard title="Roles" description={roles.isSuccess ? `${String(list.length)} roles` : undefined}>
      {roles.isPending ? <ListSkeleton label="Cargando roles…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      {roles.isError ? (
        <FormMessage tone="error">{errorMessage(roles.error, 'No se pudieron cargar los roles.')}</FormMessage>
      ) : null}
      <ul className="m-0 flex list-none flex-col p-0">
        {list.map((role) => (
          <RoleRow
            key={role.id}
            role={role}
            groups={catalog.data ?? []}
            access={roleAccess(role, granted)}
            onOpen={() => {
              onOpen(role)
            }}
          />
        ))}
      </ul>
    </SectionCard>
  )
}
