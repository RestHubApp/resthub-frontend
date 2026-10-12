import type { ActivityEntry } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { formatDateTime } from '@/services/format'
import { ActivityActionCell } from './ActivityActionCell'

/** Las columnas de la bitácora: cuándo, quién (con su rol) y qué hizo, con su detalle. Las horas son las del local. */
export function activityColumns(timeZone: string): DataColumn<ActivityEntry>[] {
  return [
    { id: 'date', header: 'Cuándo', cell: (e) => formatDateTime(e.occurred_at, timeZone), className: 'whitespace-nowrap align-top' },
    {
      id: 'who',
      header: 'Persona',
      cell: (e) => (
        <div className="flex flex-col">
          <span>{e.user_name}</span>
          <span className="text-sm text-muted-foreground">{e.user_role_label}</span>
        </div>
      ),
      className: 'align-top',
    },
    { id: 'what', header: 'Acción', cell: (e) => <ActivityActionCell entry={e} />, className: 'whitespace-normal break-words align-top' },
  ]
}
