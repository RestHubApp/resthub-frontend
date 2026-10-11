interface HeatmapHeaderProps {
  readonly hours: readonly number[]
  /** Cada cuántas horas se escribe el número a la vista; todas se anuncian. */
  readonly everyHours: number
}

/**
 * La fila de encabezados: el hueco de la esquina y una hora por columna. Cada
 * encabezado lleva su texto (axe `empty-table-header`): la hora que se ve y,
 * para el lector de pantalla, la hora entera con «h».
 */
export function HeatmapHeader({ hours, everyHours }: HeatmapHeaderProps) {
  return (
    <div role="row" className="contents">
      <span role="columnheader">
        <span className="sr-only">Día</span>
      </span>
      {hours.map((hour, index) => (
        <span key={hour} role="columnheader" className="text-center text-[11px] leading-5 text-muted-foreground tabular-nums">
          <span aria-hidden="true">{index % everyHours === 0 ? String(hour) : ''}</span>
          <span className="sr-only">{`${String(hour)} h`}</span>
        </span>
      ))}
    </div>
  )
}
