import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { rolesQuery } from '@/api/roles'
import type { StaffResponse } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { usePermissions, useSession } from '@/store/session'
import { canManageAccount } from './roleOptions'
import { RoleOptionsGate } from './RoleOptionsGate'
import { StaffCreateForm } from './StaffCreateForm'
import { STAFF_LIST_QUERY } from './staffList'
import { StaffRowActions } from './StaffRowActions'

// Una columna que en el celular se lee bajo el nombre.
const ONLY_WIDE = 'hidden sm:table-cell'

function columns(
  ownId: number | undefined,
  canManage: (account: StaffResponse) => boolean,
): DataColumn<StaffResponse>[] {
  return [
    {
      id: 'nombre',
      header: 'Nombre',
      // En el celular el correo, el rol y el estado van bajo el nombre: la tabla de cinco
      // columnas dejaba las acciones fuera de la vista a 390 px.
      cell: (account) => (
        <span className="flex flex-col">
          <span>{account.id === ownId ? `${account.full_name} (tú)` : account.full_name}</span>
          <span className="text-xs break-all text-muted-foreground sm:hidden">
            {account.email} · {account.role_label} · {account.is_active ? 'Activa' : 'Inactiva'}
          </span>
        </span>
      ),
    },
    { id: 'correo', header: 'Correo', className: ONLY_WIDE, cell: (account) => account.email },
    { id: 'rol', header: 'Rol', className: ONLY_WIDE, cell: (account) => account.role_label },
    {
      id: 'estado',
      header: 'Estado',
      className: ONLY_WIDE,
      cell: (account) => (
        <StatusBadge
          label={account.is_active ? 'Activa' : 'Inactiva'}
          tone={account.is_active ? 'completed' : undefined}
        />
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: (account) => (
        <StaffRowActions
          account={account}
          isSelf={account.id === ownId}
          manageable={canManage(account)}
        />
      ),
    },
  ]
}

/** Las cuentas del restaurante, cada una con su rol. */
export function StaffView() {
  const staff = useQuery(STAFF_LIST_QUERY)
  const roles = useQuery(rolesQuery())
  const granted = usePermissions()
  const ownId = useSession((state) => state.account?.user.id)
  const canManage = (account: StaffResponse) => canManageAccount(account, roles.data, granted)
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Personal"
        description="Quién puede entrar a RestHub, con qué rol y si está activa."
        actions={
          <Button
            type="button"
            size="lg"
            className="h-10 px-4"
            onClick={() => {
              setCreating(true)
            }}
          >
            <Icon name="agregar" size={16} />
            <span>Nueva cuenta</span>
          </Button>
        }
      />

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nueva cuenta"
        description="El rol decide qué puede hacer: un mesero toma pedidos desde su celular; un encargado administra el restaurante."
        size="lg"
      >
        <RoleOptionsGate>
          {(options) => (
            <StaffCreateForm
              roles={options}
              onDone={() => {
                setCreating(false)
              }}
            />
          )}
        </RoleOptionsGate>
      </FormDialog>

      <SectionCard title="Equipo">
        {staff.isError ? (
          <FormMessage tone="error">
            {errorMessage(staff.error, 'No se pudo cargar el personal.')}
          </FormMessage>
        ) : (
          <DataTable
            columns={columns(ownId, canManage)}
            data={staff.data?.items ?? []}
            isLoading={staff.isPending}
            emptyMessage="Todavía no hay cuentas registradas."
            getRowId={(account) => String(account.id)}
            pageSize={15}
          />
        )}
      </SectionCard>
    </div>
  )
}
