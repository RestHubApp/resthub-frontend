interface SeriesLegendProps {
  readonly items: readonly { readonly label: string; readonly color: string }[]
}

/** Qué color es cada serie. El color nunca va solo: la lectura y la tabla nombran cada una. */
export default function SeriesLegend({ items }: SeriesLegendProps) {
  return (
    <ul aria-label="Series del gráfico" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: item.color }} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
