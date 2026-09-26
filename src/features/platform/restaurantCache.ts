import type { QueryClient } from '@tanstack/react-query'

import {
  platformActivityQueryKey,
  platformRestaurantQueryKey,
  platformRestaurantsQueryKey,
} from '../../api/platform'
import type { PlatformOwner, PlatformRestaurantDetail } from '../../api/platformTypes'

function releer(queryClient: QueryClient): void {
  // Las listas, los conteos de personal y la bitácora cambian con cada alta
  // o edición: se releen de fondo.
  void queryClient.invalidateQueries({ queryKey: platformRestaurantsQueryKey })
  void queryClient.invalidateQueries({ queryKey: platformActivityQueryKey })
}

/** Pone la ficha tal como la devolvió el servidor y relee lo que depende de ella. */
export function saveRestaurant(queryClient: QueryClient, restaurant: PlatformRestaurantDetail): void {
  queryClient.setQueryData(platformRestaurantQueryKey(restaurant.id), restaurant)
  releer(queryClient)
}

/** Suma a la ficha el encargado que devolvió el servidor. */
export function saveOwner(queryClient: QueryClient, restaurantId: number, owner: PlatformOwner): void {
  queryClient.setQueryData<PlatformRestaurantDetail>(
    platformRestaurantQueryKey(restaurantId),
    (ficha) => ficha && { ...ficha, owners: [...ficha.owners.filter((otro) => otro.id !== owner.id), owner] },
  )
  releer(queryClient)
}
