import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { obsStatusQuery } from '../../../api/observability'
import type { ObsStatusCount, ObsWindowParams } from '../../../api/types'
import BarList from '../../../components/charts/BarList'
import ChartCard from '../../../components/charts/ChartCard'
import DataGrid from '../../../components/charts/DataGrid'
import EmptyState from '../../../components/EmptyState'
import { formatInteger, formatPercent } from '../../../services/format'
import { statusLabel } from './obsLabels'
import ObsQueryState from './ObsQueryState'
import type { LiveOptions } from './useObsRefresh'

interface StatusSectionProps {
  readonly params: ObsWindowParams
  readonly live: LiveOptions
}

const PERCENT = 100
const FIRST_ERROR = 400

function share(count: number, total: number): string {
  return formatPercent(total > 0 ? (count / total) * PERCENT : 0)
}

function columns(total: number) {
  return [
    { header: 'Estado', cell: (row: ObsStatusCount) => statusLabel(row.status) },
    { header: 'Peticiones', cell: (row: ObsStatusCount) => formatInteger(row.count), numeric: true },
    { header: 'Del total', cell: (row: ObsStatusCount) => share(row.count, total), numeric: true },
  ]
}

/**
 * Cuántas respuestas hubo de cada estado. Las que fallaron (4xx y 5xx) van
 * en color y las correctas en gris: la historia son los errores.
 */
export default function StatusSection({ params, live }: StatusSectionProps) {
  const estados = useQuery({ ...obsStatusQuery(params), ...live, placeholderData: keepPreviousData })

  return (
    <ObsQueryState query={estados} errorText="No se pudo cargar la distribución por estado." loadingLabel="Cargando los estados…" skeletonClassName="h-64 rounded-xl">
      {(rows) => {
        const total = rows.reduce((suma, row) => suma + row.count, 0)
        return (
          <ChartCard
            title="Respuestas por estado"
            description="En color, las que fallaron (4xx y 5xx); en gris, las correctas y las redirecciones."
            refreshing={estados.isPlaceholderData}
            chart={
              rows.length === 0 ? (
                <EmptyState title="No hubo peticiones en esta ventana." />
              ) : (
                <BarList
                  label="Respuestas por estado HTTP"
                  data={rows.map((row) => ({
                    key: String(row.status),
                    label: statusLabel(row.status),
                    value: row.count,
                    valueLabel: formatInteger(row.count),
                    tone: row.status >= FIRST_ERROR ? 'series' : 'muted',
                    details: [
                      { label: 'peticiones', value: formatInteger(row.count) },
                      { label: 'del total', value: share(row.count, total) },
                    ],
                  }))}
                />
              )
            }
            table={<DataGrid caption="Respuestas por estado" columns={columns(total)} rows={rows} rowKey={(row) => String(row.status)} />}
          />
        )
      }}
    </ObsQueryState>
  )
}
