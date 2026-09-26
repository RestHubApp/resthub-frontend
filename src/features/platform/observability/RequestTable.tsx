import { useMemo } from 'react'
import { Link } from 'react-router'

import type { ObsRequestEntry } from '../../../api/types'
import DataTable, { type DataColumn } from '../../../components/DataTable'
import { formatInteger, formatMilliseconds, formatTimestamp } from '../../../services/format'
import { PLATFORM_TIME_ZONE } from '../platformTime'
import HttpStatusBadge from './HttpStatusBadge'
import { logsOf, type ObsFilters } from './obsFilters'
import { ACCOUNT_KIND_LABELS } from './obsLabels'

interface RequestTableProps {
  readonly entries: readonly ObsRequestEntry[]
  readonly isLoading: boolean
  readonly filters: ObsFilters
}

const NUMERO = 'text-right tabular-nums whitespace-nowrap'
const ENLACE =
  'rounded text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

function consultas(count: number): string {
  return count === 1 ? '1 consulta' : `${formatInteger(count)} consultas`
}

function cuenta(entry: ObsRequestEntry): string {
  const local = entry.restaurant_id === null ? '' : ` · restaurante #${String(entry.restaurant_id)}`
  return `${ACCOUNT_KIND_LABELS[entry.account_kind]}${local}`
}

function columns(filters: ObsFilters): DataColumn<ObsRequestEntry>[] {
  return [
    { id: 'hora', header: 'Hora', cell: (r) => formatTimestamp(r.at, PLATFORM_TIME_ZONE), className: 'whitespace-nowrap tabular-nums' },
    {
      id: 'ruta',
      header: 'Ruta',
      className: 'min-w-56 whitespace-normal',
      cell: (r) => (
        <span>
          <span className="mr-2 font-mono text-xs text-muted-foreground">{r.method}</span>
          <code className="text-sm break-all">{r.route}</code>
        </span>
      ),
    },
    { id: 'estado', header: 'Estado', cell: (r) => <HttpStatusBadge status={r.status} /> },
    { id: 'duracion', header: 'Duración', cell: (r) => formatMilliseconds(r.duration_ms), className: NUMERO },
    {
      id: 'base',
      header: 'Base',
      className: NUMERO,
      cell: (r) => `${formatMilliseconds(r.db_ms)} · ${consultas(r.db_queries)}`,
    },
    { id: 'cuenta', header: 'Cuenta', cell: cuenta },
    {
      id: 'peticion',
      header: 'request_id',
      cell: (r) => (
        <Link
          to={{ search: logsOf(filters, r.request_id).toString(), hash: 'logs' }}
          className={ENLACE}
          aria-label={`Ver los logs de ${r.request_id}`}
        >
          <code className="text-xs">{r.request_id}</code>
        </Link>
      ),
    },
  ]
}

/** Las peticiones una por una; su `request_id` lleva a sus logs. */
export default function RequestTable({ entries, isLoading, filters }: RequestTableProps) {
  const columnas = useMemo(() => columns(filters), [filters])
  return (
    <DataTable
      columns={columnas}
      data={entries}
      isLoading={isLoading}
      emptyMessage="No hay peticiones con esos filtros en esta ventana."
      getRowId={(r) => String(r.id)}
    />
  )
}
