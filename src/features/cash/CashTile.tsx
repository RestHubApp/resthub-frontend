interface TileProps {
  readonly label: string
  readonly value: string
  readonly strong?: boolean
}

/** Un número del turno; el que importa al cerrar va resaltado. */
export default function CashTile({ label, value, strong = false }: TileProps) {
  return (
    <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 ${strong ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
      <dt className="text-xs">{label}</dt>
      <dd className="m-0 text-lg font-bold tabular-nums">{value}</dd>
    </div>
  )
}
