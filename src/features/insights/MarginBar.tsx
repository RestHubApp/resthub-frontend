import { formatPercent, toNumber } from '@/services/format'

interface MarginBarProps {
  readonly percent: string
}

const PERCENT = 100

/** El margen porcentual de un plato: una barra de 0 a 100 % y el número a su lado. */
export function MarginBar({ percent }: MarginBarProps) {
  const value = toNumber(percent)
  if (value < 0) {
    return <span className="font-medium text-destructive">{`${formatPercent(value)} (pérdida)`}</span>
  }
  return (
    <span className="flex items-center justify-end gap-2">
      <span aria-hidden className="h-2.5 w-20 shrink-0">
        <span
          className="block h-full rounded-r-[4px]"
          style={{ width: `${String(Math.min(value, PERCENT))}%`, background: 'var(--chart-1)' }}
        />
      </span>
      <span className="w-14 text-right tabular-nums">{formatPercent(value)}</span>
    </span>
  )
}
