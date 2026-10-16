import type { CountDifferences } from '@/api/types'
import { differenceTone, formatSignedMoney } from './differenceMath'

const TONES = { loss: 'text-destructive', gain: 'text-success', even: 'text-foreground' } as const

/** El total valorizado arriba: lo que faltó, lo que sobró y el neto, en soles. */
export function DifferenceSummary({ report }: { readonly report: CountDifferences }) {
  const tiles = [
    { label: 'Neto', value: report.total_value },
    { label: 'Faltó', value: report.loss_value },
    { label: 'Sobró', value: report.gain_value },
  ]
  return (
    <dl className="m-0 grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col gap-1 rounded-xl border bg-card p-3 sm:p-4">
          <dt className="text-sm text-muted-foreground">{tile.label}</dt>
          <dd className={`m-0 text-lg font-semibold tabular-nums sm:text-2xl ${TONES[differenceTone(tile.value)]}`}>
            {formatSignedMoney(tile.value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
