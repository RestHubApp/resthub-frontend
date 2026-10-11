interface HeatmapHeaderProps {
  readonly hours: readonly number[]
  /** Cada cuántas horas se escribe el número a la vista; todas se anuncian. */
  readonly everyHours: number
}

/** La fila de encabezados: el hueco de la esquina y una hora por columna. */
export function HeatmapHeader({ hours, everyHours }: HeatmapHeaderProps) {
  return (
    <div role="row" className="contents">
      <span role="columnheader" aria-label="Día" />
      {hours.map((hour, index) => (
        <span
          key={hour}
          role="columnheader"
          aria-label={`${String(hour)} h`}
          className="text-center text-[11px] leading-5 text-muted-foreground tabular-nums"
        >
          {index % everyHours === 0 ? String(hour) : ''}
        </span>
      ))}
    </div>
  )
}
