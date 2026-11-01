import { useQuery } from '@tanstack/react-query'

import { restaurantQuery } from '@/api/restaurant'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { OpeningHoursEditor } from './OpeningHoursEditor'

/**
 * El horario del local, editable solo con el guardado ya a la vista: si se
 * editara mientras carga o tras un error, «Guardar horario» reemplazaría en el
 * servidor los tramos que no se llegaron a ver.
 */
export function OpeningHoursForm() {
  const restaurant = useQuery(restaurantQuery)

  if (restaurant.isPending) {
    return <ListSkeleton label="Cargando el horario…" count={2} itemClassName="h-10 rounded-md" />
  }
  if (restaurant.isError) {
    return <RetryQueryError error={restaurant.error} fallback="No se pudo cargar el horario." onRetry={() => { void restaurant.refetch() }} />
  }
  return <OpeningHoursEditor saved={restaurant.data.opening_hours} />
}
