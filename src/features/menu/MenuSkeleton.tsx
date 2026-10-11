import { LoadingRegion } from '@/components/LoadingRegion'
import { Skeleton } from '@/components/ui/skeleton'

// Dos categorías de muestra, con distinta cantidad de platos.
const CATEGORIES = [4, 3]

/** Tarjetas de categoría con sus filas vacías mientras llega la carta. */
export function MenuSkeleton() {
  return (
    <LoadingRegion label="Cargando la carta…" className="flex flex-col gap-6">
      {CATEGORIES.map((dishes, category) => (
        <div key={category} className="flex flex-col rounded-xl bg-card py-4 shadow-sm ring-1 ring-foreground/10">
          <div className="flex flex-col gap-2 border-b px-5 pb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          {Array.from({ length: dishes }, (_, dish) => (
            <div key={dish} className="border-b px-5 py-3 last:border-b-0">
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      ))}
    </LoadingRegion>
  )
}
