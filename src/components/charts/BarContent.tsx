import type { BarDatum } from './BarRow'

interface BarContentProps {
  readonly datum: BarDatum
  readonly max: number
  readonly reservation: number
}

const TONES = { series: 'var(--chart-1)', muted: 'var(--muted-foreground)' } as const

/** La etiqueta, el aviso y la barra con su valor escrito: lo que se ve de una fila. */
export function BarContent({ datum, max, reservation }: BarContentProps) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate" title={datum.label}>
          {datum.label}
        </span>
        {datum.badge}
      </span>
      {/* Separa la etiqueta del valor en el texto visible («Lomo saltado 12 porc.»), que
          debe estar dentro del nombre de la fila (WCAG 2.5.3). Entre celdas de la grilla
          no se dibuja. */}
      {' '}
      <span aria-hidden className="flex min-w-0 items-center gap-2">
        <span
          className="h-3.5 shrink-0 rounded-r-[4px]"
          style={{
            width: `calc((100% - ${String(reservation)}rem) * ${String(max > 0 ? datum.value / max : 0)})`,
            minWidth: datum.value > 0 ? 2 : 0,
            background: TONES[datum.tone ?? 'series'],
          }}
        />
        <span className="text-sm font-medium whitespace-nowrap tabular-nums">{datum.valueLabel}</span>
      </span>
    </>
  )
}
