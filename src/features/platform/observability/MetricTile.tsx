interface MetricTileProps {
  readonly label: string
  readonly value: string
  readonly detail?: string
  /** Un aviso, como eventos perdidos: el borde y el texto lo dicen, además del número. */
  readonly warning?: boolean
}

/** Un indicador de la ventana: el número grande y, debajo, de qué sale. */
export default function MetricTile({ label, value, detail, warning = false }: MetricTileProps) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 rounded-xl bg-card px-4 py-4 ring-1 ${warning ? 'ring-warning' : 'ring-foreground/10'}`}
    >
      <p className={`m-0 text-sm ${warning ? 'font-medium text-warning' : 'text-muted-foreground'}`}>{label}</p>
      <p className="m-0 text-2xl leading-tight font-semibold text-foreground tabular-nums sm:text-[1.75rem]">{value}</p>
      {detail === undefined ? null : <p className="m-0 text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}
