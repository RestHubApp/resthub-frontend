import { useQuery } from '@tanstack/react-query'
import { ErrorMessage } from '@/components/ErrorMessage'

import { rolesQuery } from '@/api/roles'
import type { StaffResponse } from '@/api/types'
import { DataTable } from '@/components/DataTable'
import { SectionCard } from '@/components/SectionCard'
import { staffOf, usePermissions, useSession } from '@/store/session'
import { canManageAccount } from './roleOptions'
import { staffColumns } from './StaffColumns'
import { STAFF_LIST_QUERY } from './staffList'

/** La tarjeta «Equipo»: la tabla de cuentas con sus acciones, o el error de carga. */
export function StaffTeamCard() {
  const staff = useQuery(STAFF_LIST_QUERY)
  const roles = useQuery(rolesQuery())
  const granted = usePermissions()
  const ownId = useSession((state) => staffOf(state.account)?.user.id)
  const canManage = (account: StaffResponse) => canManageAccount(account, roles.data, granted)

  return (
    <SectionCard title="Equipo">
      {staff.isError ? (
        <ErrorMessage error={staff.error} fallback="No se pudo cargar el personal." />
      ) : (
        <DataTable
          label="Personal"
          columns={staffColumns({ ownId, canManage })}
          data={staff.data?.items ?? []}
          isLoading={staff.isPending}
          emptyMessage="Todavía no hay cuentas registradas."
          getRowId={(account) => String(account.id)}
          pageSize={15}
        />
      )}
    </SectionCard>
  )
}
