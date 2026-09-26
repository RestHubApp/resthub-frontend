import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { rolesQuery } from '../../api/roles'
import type { StaffResponse } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import FormDialog from '../../components/FormDialog'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import StatusBadge from '../../components/StatusBadge'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { usePermissions, useSession } from '../../store/session'
import { canManageAccount } from './roleOptions'
import RoleOptionsGate from './RoleOptionsGate'
import StaffCreateForm from './StaffCreateForm'
import { STAFF_LIST_QUERY } from './staffList'
import StaffRowActions from './StaffRowActions'

function columnas(
  propiaId: number | undefined,
  puedeGestionar: (cuenta: StaffResponse) => boolean,
): DataColumn<StaffResponse>[] {
  return [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (cuenta) => (cuenta.id === propiaId ? `${cuenta.full_name} (tú)` : cuenta.full_name),
    },
    { id: 'correo', header: 'Correo', cell: (cuenta) => cuenta.email },
    { id: 'rol', header: 'Rol', cell: (cuenta) => cuenta.role_label },
    {
      id: 'estado',
      header: 'Estado',
      cell: (cuenta) => (
        <StatusBadge
          label={cuenta.is_active ? 'Activa' : 'Inactiva'}
          tone={cuenta.is_active ? 'completed' : undefined}
        />
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: (cuenta) => (
        <StaffRowActions
          account={cuenta}
          isSelf={cuenta.id === propiaId}
          manageable={puedeGestionar(cuenta)}
        />
      ),
    },
  ]
}

/** Las cuentas del restaurante, cada una con su rol. */
export default function StaffView() {
  const personal = useQuery(STAFF_LIST_QUERY)
  const roles = useQuery(rolesQuery())
  const granted = usePermissions()
  const propiaId = useSession((state) => state.account?.user.id)
  const puedeGestionar = (cuenta: StaffResponse) => canManageAccount(cuenta, roles.data, granted)
  const [creando, setCreando] = useState(false)

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
              setCreando(true)
            }}
          >
            <Icon name="agregar" size={16} />
            <span>Nueva cuenta</span>
          </Button>
        }
      />

      <FormDialog
        open={creando}
        onOpenChange={setCreando}
        title="Nueva cuenta"
        description="El rol decide qué puede hacer: un mesero toma pedidos desde su celular; un encargado administra el restaurante."
        size="lg"
      >
        <RoleOptionsGate>
          {(opciones) => (
            <StaffCreateForm
              roles={opciones}
              onDone={() => {
                setCreando(false)
              }}
            />
          )}
        </RoleOptionsGate>
      </FormDialog>

      <SectionCard title="Equipo">
        {personal.isError ? (
          <FormMessage tone="error">
            {errorMessage(personal.error, 'No se pudo cargar el personal.')}
          </FormMessage>
        ) : (
          <DataTable
            columns={columnas(propiaId, puedeGestionar)}
            data={personal.data?.items ?? []}
            isLoading={personal.isPending}
            emptyMessage="Todavía no hay cuentas registradas."
            getRowId={(cuenta) => String(cuenta.id)}
            pageSize={15}
          />
        )}
      </SectionCard>
    </div>
  )
}
