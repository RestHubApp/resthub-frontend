import type { ActivityEntry } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { formatDateTime } from '@/services/format'

/** Las columnas de la bitácora; las horas son las del local. */
export function activityColumns(timeZone: string): DataColumn<ActivityEntry>[] {
  return [
    { id: 'date', header: 'Fecha', cell: (e) => formatDateTime(e.occurred_at, timeZone), className: 'whitespace-nowrap' },
    { id: 'who', header: 'Quién', cell: (e) => `${e.user_name} (${e.user_role_label})` },
    { id: 'what', header: 'Qué', cell: (e) => e.kind_label },
    { id: 'detail', header: 'Detalle', cell: (e) => e.detail, className: 'whitespace-normal break-words' },
  ]
}
