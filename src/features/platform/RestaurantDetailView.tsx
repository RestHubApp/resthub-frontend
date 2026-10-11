import { useQuery } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router'

import { platformRestaurantQuery } from '@/api/platform'
import { BackLink } from '@/components/BackLink'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { errorStatus } from '@/services/apiError'
import { paths } from '@/services/paths'
import { PlatformQueryError } from './PlatformQueryError'
import { RestaurantDetailContent } from './RestaurantDetailContent'

const NOT_FOUND = 404
const BACK = <BackLink to={paths.platform.home} label="Restaurantes" />

function justCreated(status: unknown): boolean {
  return typeof status === 'object' && status !== null && 'created' in status && status.created === true
}

/** La ficha de un restaurante: sus datos, su estado y sus encargados. */
export function RestaurantDetailView() {
  const restaurantId = Number(useParams()['restaurantId'])
  const wasCreated = justCreated(useLocation().state)
  const isValid = Number.isInteger(restaurantId) && restaurantId > 0
  const card = useQuery({ ...platformRestaurantQuery(restaurantId), enabled: isValid })

  if (!isValid || errorStatus(card.error) === NOT_FOUND) {
    return (
      <div className="flex flex-col gap-5">
        {BACK}
        <EmptyState title="Este restaurante no existe." description="Revisa el enlace o búscalo en la lista." />
      </div>
    )
  }
  if (card.isError) {
    return (
      <div className="flex flex-col gap-5">
        {BACK}
        <PlatformQueryError error={card.error} fallback="No se pudo cargar el restaurante." onRetry={() => void card.refetch()} />
      </div>
    )
  }
  if (card.isPending) {
    return <ListSkeleton label="Cargando el restaurante…" count={3} itemClassName="h-32 rounded-xl" />
  }

  return <RestaurantDetailContent restaurant={card.data} wasCreated={wasCreated} />
}
