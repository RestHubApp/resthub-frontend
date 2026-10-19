import type { StaffResponse } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { DeactivationNote } from './DeactivationNote'
import { StaffRowActions } from './StaffRowActions'

// Una columna que en el celular se lee bajo el nombre.
const ONLY_WIDE = 'hidden sm:table-cell'

interface StaffColumnsOptions {
  /** La cuenta de quien mira, para marcarla «(tú)». */
  readonly ownId: number | undefined
  /** Si quien mira puede cambiar la cuenta. */
  readonly canManage: (account: StaffResponse) => boolean
  /** El nombre de una cuenta de la lista, para decir quién desactivó a otra. */
  readonly nameOf: (userId: number) => string | undefined
}

/** Las columnas de la tabla del equipo. */
export function staffColumns({ ownId, canManage, nameOf }: StaffColumnsOptions): DataColumn<StaffResponse>[] {
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
          <DeactivationNote account={account} nameOf={nameOf} />
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

