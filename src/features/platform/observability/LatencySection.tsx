import type { ObsTimePoint, ObsWindowParams } from '../../../api/types'
import AreaChart from '../../../components/charts/AreaChart'
import ChartCard from '../../../components/charts/ChartCard'
import DataGrid, { type GridColumn } from '../../../components/charts/DataGrid'
import { formatInteger, formatMilliseconds } from '../../../services/format'
import { PLATFORM_TIME_ZONE } from '../platformTime'
import { bucketTitle, formatBucket, toSeries } from './obsLabels'
import ObsQueryState from './ObsQueryState'
import type { LiveOptions } from './useObsRefresh'
import { useTimeseries } from './useTimeseries'

interface LatencySectionProps {
  readonly params: ObsWindowParams
  readonly live: LiveOptions
}

function columns(bucketSeconds: number): GridColumn<ObsTimePoint>[] {
  return [
    { header: 'Cubo', cell: (p) => bucketTitle(p.t, bucketSeconds, PLATFORM_TIME_ZONE) },
    { header: 'p95', cell: (p) => formatMilliseconds(p.p95_ms), numeric: true },
    { header: 'Peticiones', cell: (p) => formatInteger(p.requests), numeric: true },
  ]
}

/**
 * El p95 de cada cubo, en su propio gráfico: son milisegundos y no
 * peticiones, y compartir eje con el tráfico aplastaría una de las dos.
 */
export default function LatencySection({ params, live }: LatencySectionProps) {
  const serie = useTimeseries(params, live)

  return (
    <ObsQueryState query={serie} errorText="No se pudo cargar la latencia." loadingLabel="Cargando la latencia…" skeletonClassName="h-80 rounded-xl">
      {({ points, bucket_seconds: bucket, sampled }) => (
        <ChartCard
          title="Latencia p95"
          description={`El 95 % de las peticiones de cada cubo de ${formatBucket(bucket)} tardó menos que esto. Un cubo sin tráfico marca cero.${sampled ? ' Sale de una muestra.' : ''}`}
          refreshing={serie.isPlaceholderData}
          chart={
            <AreaChart
              points={toSeries(points, bucket, PLATFORM_TIME_ZONE, (p) => p.p95_ms)}
              label={`Latencia p95 por cubo de ${formatBucket(bucket)}, horas de Lima`}
              formatValue={formatMilliseconds}
              formatTick={formatMilliseconds}
              describe={(index) => ({
                title: bucketTitle(points[index].t, bucket, PLATFORM_TIME_ZONE),
                rows: [
                  { label: 'p95', value: formatMilliseconds(points[index].p95_ms), swatch: 'var(--chart-1)' },
                  { label: 'peticiones', value: formatInteger(points[index].requests) },
                ],
              })}
            />
          }
          table={<DataGrid caption="Latencia p95 por cubo" columns={columns(bucket)} rows={points} rowKey={(p) => p.t} />}
        />
      )}
    </ObsQueryState>
  )
}
