import type { ObsTimePoint, ObsWindowParams } from '../../../api/types'
import ChartCard from '../../../components/charts/ChartCard'
import DataGrid, { type GridColumn } from '../../../components/charts/DataGrid'
import { formatInteger, formatMilliseconds } from '../../../services/format'
import { PLATFORM_TIME_ZONE } from '../platformTime'
import { bucketTitle, formatBucket } from './obsLabels'
import ObsQueryState from './ObsQueryState'
import TrafficChart from './TrafficChart'
import type { LiveOptions } from './useObsRefresh'
import { useTimeseries } from './useTimeseries'

interface TrafficSectionProps {
  readonly params: ObsWindowParams
  readonly live: LiveOptions
}

function columns(bucketSeconds: number): GridColumn<ObsTimePoint>[] {
  return [
    { header: 'Cubo', cell: (p) => bucketTitle(p.t, bucketSeconds, PLATFORM_TIME_ZONE) },
    { header: 'Peticiones', cell: (p) => formatInteger(p.requests), numeric: true },
    { header: 'Errores 5xx', cell: (p) => formatInteger(p.errors_5xx), numeric: true },
    { header: 'p95', cell: (p) => formatMilliseconds(p.p95_ms), numeric: true },
  ]
}

/** Peticiones y errores 5xx a lo largo de la ventana. */
export default function TrafficSection({ params, live }: TrafficSectionProps) {
  const serie = useTimeseries(params, live)

  return (
    <ObsQueryState query={serie} errorText="No se pudo cargar el tráfico." loadingLabel="Cargando el tráfico…" skeletonClassName="h-80 rounded-xl">
      {(data) => (
        <ChartCard
          title="Tráfico"
          description={`Peticiones y errores del servidor por cubo de ${formatBucket(data.bucket_seconds)}. Un cubo sin tráfico cuenta como cero.`}
          refreshing={serie.isPlaceholderData}
          chart={<TrafficChart series={data} />}
          table={
            <DataGrid caption="Tráfico por cubo" columns={columns(data.bucket_seconds)} rows={data.points} rowKey={(p) => p.t} />
          }
        />
      )}
    </ObsQueryState>
  )
}
