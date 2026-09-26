import type { ObsSummary } from '../../../api/types'
import { formatInteger, formatMilliseconds } from '../../../services/format'
import MetricTile from './MetricTile'
import { formatErrorRate } from './obsLabels'

function locales(count: number): string {
  return count === 1 ? 'De 1 restaurante' : `De ${formatInteger(count)} restaurantes`
}

/** Peticiones, tasa de error, p95, p99, tiempo de base y, si hubo, eventos perdidos. */
export default function SummaryTiles({ summary }: { readonly summary: ObsSummary }) {
  return (
    <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${summary.dropped_events > 0 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
      <MetricTile label="Peticiones" value={formatInteger(summary.requests)} detail={locales(summary.active_restaurants)} />
      <MetricTile
        label="Tasa de error"
        value={formatErrorRate(summary.error_rate)}
        detail={`${formatInteger(summary.errors_5xx)} con 5xx · ${formatInteger(summary.errors_4xx)} con 4xx`}
      />
      <MetricTile label="p95" value={formatMilliseconds(summary.p95_ms)} detail={`p50: ${formatMilliseconds(summary.p50_ms)}`} />
      <MetricTile label="p99" value={formatMilliseconds(summary.p99_ms)} detail="El 1 % más lento tarda más que esto" />
      <MetricTile label="Tiempo medio de base" value={formatMilliseconds(summary.avg_db_ms)} detail="Consultas a la base por petición" />
      {summary.dropped_events > 0 ? (
        <MetricTile
          warning
          label="Eventos perdidos"
          value={formatInteger(summary.dropped_events)}
          detail="Lo que este proceso no pudo guardar desde que arrancó"
        />
      ) : null}
    </div>
  )
}
