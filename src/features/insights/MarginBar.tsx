import { formatPercent, toNumber } from './format'

interface MarginBarProps {
  readonly percent: string
}

const PERCENT = 100

/** El margen porcentual de un plato: una barra de 0 a 100 % y el número a su lado. */
export default function MarginBar({ percent }: MarginBarProps) {
  const valor = toNumber(percent)
  if (valor < 0) {
    return <span className="font-medium text-destructive">{`${formatPercent(valor)} (pérdida)`}</span>
  }
  return (
    <span className="flex items-center justify-end gap-2">
      <span aria-hidden className="h-2.5 w-20 shrink-0">
        <span
          className="block h-full rounded-r-[4px]"
          style={{ width: `${String(Math.min(valor, PERCENT))}%`, background: 'var(--chart-1)' }}
        />
      </span>
      <span className="w-14 text-right tabular-nums">{formatPercent(valor)}</span>
    </span>
  )
}
