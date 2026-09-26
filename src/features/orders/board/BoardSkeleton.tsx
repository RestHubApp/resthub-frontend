import LoadingRegion from '../../../components/LoadingRegion'
import { Skeleton } from '../../../components/ui/skeleton'

interface BoardSkeletonProps {
  /** Los títulos de las columnas, que ya se conocen antes de los pedidos. */
  readonly titles: readonly string[]
}

const TARJETAS = 2

/** Las columnas del tablero con tarjetas vacías mientras llegan los pedidos. */
export default function BoardSkeleton({ titles }: BoardSkeletonProps) {
  return (
    <LoadingRegion label="Cargando pedidos…" className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {titles.map((title) => (
        <div key={title} className="flex min-w-0 flex-col gap-3 rounded-2xl bg-muted/60 p-3">
          <p className="m-0 px-1 text-base font-semibold">{title}</p>
          {Array.from({ length: TARJETAS }, (_, indice) => (
            <Skeleton key={indice} className="h-32 rounded-xl bg-card" />
          ))}
        </div>
      ))}
    </LoadingRegion>
  )
}
