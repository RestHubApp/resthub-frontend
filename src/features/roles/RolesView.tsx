import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { permissionsQuery, rolesQuery } from '../../api/roles'
import type { Role } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import ListSkeleton from '../../components/ListSkeleton'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { usePermissions } from '../../store/session'
import { groupPermissions } from './permissionGroups'
import { roleAccess } from './roleAccess'
import RoleFormDialog from './RoleFormDialog'
import RoleRow from './RoleRow'

/**
 * Los roles del restaurante y qué puede hacer cada uno.
 *
 * El encargado y el mesero vienen con el local; los demás (cocina, caja) los
 * arma cada restaurante con los permisos del catálogo.
 */
export default function RolesView() {
  const roles = useQuery(rolesQuery())
  // Solo da nombre a los grupos del resumen: sin él, la lista igual se muestra.
  const catalogo = useQuery({ ...permissionsQuery(), select: groupPermissions })
  const granted = usePermissions()
  // `undefined` cerrada; `null` para crear; un rol para editarlo o verlo.
  const [abierto, setAbierto] = useState<Role | null | undefined>(undefined)
  const lista = roles.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles y permisos"
        description="Qué puede hacer cada persona según su rol. El rol de cada cuenta se elige en Personal."
        actions={
          <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
            setAbierto(null)
          }}>
            <Icon name="agregar" size={16} />
            <span>Nuevo rol</span>
          </Button>
        }
      />
      <RoleFormDialog
        role={abierto ?? null}
        open={abierto !== undefined}
        onOpenChange={(valor) => {
          if (!valor) {
            setAbierto(undefined)
          }
        }}
      />
      <SectionCard title="Roles" description={roles.isSuccess ? `${String(lista.length)} roles` : undefined}>
        {roles.isPending ? <ListSkeleton label="Cargando roles…" count={3} itemClassName="h-16 rounded-lg" /> : null}
        {roles.isError ? (
          <FormMessage tone="error">{errorMessage(roles.error, 'No se pudieron cargar los roles.')}</FormMessage>
        ) : null}
        <ul className="m-0 flex list-none flex-col p-0">
          {lista.map((rol) => (
            <RoleRow
              key={rol.id}
              role={rol}
              groups={catalogo.data ?? []}
              access={roleAccess(rol, granted)}
              onOpen={() => {
                setAbierto(rol)
              }}
            />
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
