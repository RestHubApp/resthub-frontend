import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchStaff, staffQueryKey } from '../../api/staff'
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
import { useSession } from '../../store/session'
import StaffCreateForm from './StaffCreateForm'
import StaffRowActions from './StaffRowActions'

function columnas(propiaId: number | undefined): DataColumn<StaffResponse>[] {
  return [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (cuenta) => (cuenta.id === propiaId ? `${cuenta.full_name} (tú)` : cuenta.full_name),
    },
    { id: 'correo', header: 'Correo', cell: (cuenta) => cuenta.email },
    { id: 'tipo', header: 'Tipo de cuenta', cell: (cuenta) => cuenta.role_label },
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
      cell: (cuenta) => <StaffRowActions account={cuenta} isSelf={cuenta.id === propiaId} />,
    },
  ]
}

/** Las cuentas de meseros y encargados del restaurante. */
export default function StaffView() {
  const personal = useQuery({ queryKey: staffQueryKey, queryFn: fetchStaff })
  const propiaId = useSession((state) => state.account?.user.id)
  const [creando, setCreando] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Personal"
        description="Quién puede entrar a RestHub, con qué tipo de cuenta y si está activa."
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
        description="Un mesero toma pedidos desde su celular; un encargado además administra el restaurante."
        size="lg"
      >
        <StaffCreateForm
          onDone={() => {
            setCreando(false)
          }}
        />
      </FormDialog>

      <SectionCard title="Equipo">
        {personal.isError ? (
          <FormMessage tone="error">
            {errorMessage(personal.error, 'No se pudo cargar el personal.')}
          </FormMessage>
        ) : (
          <DataTable
            columns={columnas(propiaId)}
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
