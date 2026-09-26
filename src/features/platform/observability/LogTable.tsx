import type { ObsLogEntry } from '../../../api/types'
import DataTable, { type DataColumn } from '../../../components/DataTable'
import { formatTimestamp } from '../../../services/format'
import { PLATFORM_TIME_ZONE } from '../platformTime'
import ExpandButton from './ExpandButton'
import LevelBadge from './LevelBadge'
import LogDetail from './LogDetail'
import type { ObsFilters } from './obsFilters'

interface LogTableProps {
  readonly entries: readonly ObsLogEntry[]
  readonly isLoading: boolean
  readonly filters: ObsFilters
}

const SIN_DATO = '—'

const COLUMNAS: DataColumn<ObsLogEntry>[] = [
  { id: 'hora', header: 'Hora', cell: (e) => formatTimestamp(e.at, PLATFORM_TIME_ZONE), className: 'whitespace-nowrap tabular-nums' },
  { id: 'nivel', header: 'Nivel', cell: (e) => <LevelBadge level={e.level} /> },
  {
    id: 'evento',
    header: 'Evento',
    className: 'min-w-56 whitespace-normal break-words',
    cell: (e) => (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{e.event}</span>
        {e.has_traceback ? <span className="text-xs text-muted-foreground">Con traceback</span> : null}
      </span>
    ),
  },
  {
    id: 'peticion',
    header: 'request_id',
    className: 'max-w-48 truncate',
    cell: (e) => (e.request_id === null ? SIN_DATO : <code className="text-xs" title={e.request_id}>{e.request_id}</code>),
  },
  { id: 'local', header: 'Restaurante', cell: (e) => (e.restaurant_id === null ? SIN_DATO : `#${String(e.restaurant_id)}`) },
  { id: 'detalle', header: 'Detalle', cell: (_, fila) => <ExpandButton row={fila} /> },
]

/** Los logs, de los más nuevos a los más viejos; cada uno abre su detalle debajo. */
export default function LogTable({ entries, isLoading, filters }: LogTableProps) {
  return (
    <DataTable
      columns={COLUMNAS}
      data={entries}
      isLoading={isLoading}
      emptyMessage="No hay logs con esos filtros en esta ventana."
      getRowId={(e) => String(e.id)}
      renderExpanded={(e) => <LogDetail entryId={e.id} filters={filters} />}
    />
  )
}
