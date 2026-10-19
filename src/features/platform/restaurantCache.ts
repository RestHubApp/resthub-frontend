import type { QueryClient } from '@tanstack/react-query'

import {
  platformActivityQueryKey,
  platformRestaurantQueryKey,
  platformRestaurantsQueryKey,
} from '@/api/platform'
import type { PlatformOwner, PlatformRestaurantDetail } from '@/api/types'

function reread(queryClient: QueryClient): void {
  // Las listas, los conteos de personal y la bitácora cambian con cada alta
  // o edición: se releen de fondo.
  void queryClient.invalidateQueries({ queryKey: platformRestaurantsQueryKey })
  void queryClient.invalidateQueries({ queryKey: platformActivityQueryKey })
}

/** Pone la ficha tal como la devolvió el servidor y relee lo que depende de ella. */
export function saveRestaurant(queryClient: QueryClient, restaurant: PlatformRestaurantDetail): void {
  queryClient.setQueryData(platformRestaurantQueryKey(restaurant.id), restaurant)
  reread(queryClient)
}

/** Pone en la ficha el encargado que devolvió el servidor: en su lugar si ya estaba, al final si es nuevo. */
export function saveOwner(queryClient: QueryClient, restaurantId: number, owner: PlatformOwner): void {
  queryClient.setQueryData<PlatformRestaurantDetail>(
    platformRestaurantQueryKey(restaurantId),
    (card) => {
      if (card === undefined) return card
      const isKnown = card.owners.some((other) => other.id === owner.id)
      const owners = isKnown ? card.owners.map((other) => (other.id === owner.id ? owner : other)) : [...card.owners, owner]
      return { ...card, owners }
    },
  )
  reread(queryClient)
}
