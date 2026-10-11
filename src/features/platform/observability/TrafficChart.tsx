import type { ObsTimeseries } from '@/api/types'
import { AreaChart } from '@/components/charts/AreaChart'
import { formatInteger } from '@/services/format'
import { PLATFORM_TIME_ZONE } from '@/features/platform/platformTime'
import { bucketTitle, formatBucket, toSeries } from './obsLabels'
import { SeriesLegend } from './SeriesLegend'

const REQUESTS = 'var(--chart-1)'
const ERRORS = 'var(--chart-2)'
const LEGEND = [
  { label: 'Peticiones', color: REQUESTS },
  { label: 'Errores 5xx', color: ERRORS },
]

/** Las peticiones como área y los errores 5xx como línea, en el mismo eje. */
export function TrafficChart({ series }: { readonly series: ObsTimeseries }) {
  const { points, bucket_seconds: bucket } = series
  return (
    <div className="flex flex-col gap-3">
      <SeriesLegend items={LEGEND} />
      <AreaChart
        points={toSeries(points, { bucketSeconds: bucket, timeZone: PLATFORM_TIME_ZONE, value: (p) => p.requests })}
        overlay={{ values: points.map((p) => p.errors_5xx), color: ERRORS }}
        label={`Peticiones y errores 5xx por cubo de ${formatBucket(bucket)}, horas de Lima`}
        formatValue={formatInteger}
        formatTick={formatInteger}
        describe={(index) => {
          const point = points[index]
          if (point === undefined) {
            return { title: '', rows: [] }
          }
          return {
            title: bucketTitle(point.t, bucket, PLATFORM_TIME_ZONE),
            rows: [
              { label: 'peticiones', value: formatInteger(point.requests), swatch: REQUESTS },
              { label: 'errores 5xx', value: formatInteger(point.errors_5xx), swatch: ERRORS },
            ],
          }
        }}
      />
    </div>
  )
}
