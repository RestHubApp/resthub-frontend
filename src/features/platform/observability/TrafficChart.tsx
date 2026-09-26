import type { ObsTimeseries } from '../../../api/types'
import AreaChart from '../../../components/charts/AreaChart'
import { formatInteger } from '../../../services/format'
import { PLATFORM_TIME_ZONE } from '../platformTime'
import { bucketTitle, formatBucket, toSeries } from './obsLabels'
import SeriesLegend from './SeriesLegend'

const PETICIONES = 'var(--chart-1)'
const ERRORES = 'var(--chart-2)'
const LEYENDA = [
  { label: 'Peticiones', color: PETICIONES },
  { label: 'Errores 5xx', color: ERRORES },
]

/** Las peticiones como área y los errores 5xx como línea, en el mismo eje. */
export default function TrafficChart({ series }: { readonly series: ObsTimeseries }) {
  const { points, bucket_seconds: bucket } = series
  return (
    <div className="flex flex-col gap-3">
      <SeriesLegend items={LEYENDA} />
      <AreaChart
        points={toSeries(points, bucket, PLATFORM_TIME_ZONE, (p) => p.requests)}
        overlay={{ values: points.map((p) => p.errors_5xx), color: ERRORES }}
        label={`Peticiones y errores 5xx por cubo de ${formatBucket(bucket)}, horas de Lima`}
        formatValue={formatInteger}
        formatTick={formatInteger}
        describe={(index) => {
          const punto = points[index]
          return {
            title: bucketTitle(punto.t, bucket, PLATFORM_TIME_ZONE),
            rows: [
              { label: 'peticiones', value: formatInteger(punto.requests), swatch: PETICIONES },
              { label: 'errores 5xx', value: formatInteger(punto.errors_5xx), swatch: ERRORES },
            ],
          }
        }}
      />
    </div>
  )
}
