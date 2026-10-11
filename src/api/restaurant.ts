import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { OwnRestaurant, UpdateRestaurantRequest } from './types'

// El restaurante de la cuenta: cualquiera lo lee, el encargado lo edita.

export const restaurantQueryKey = ['restaurant'] as const

async function fetchRestaurant(): Promise<OwnRestaurant> {
  return send((client) => client.GET('/api/v1/restaurant'))
}

export const restaurantQuery = queryOptions({
  queryKey: restaurantQueryKey,
  queryFn: fetchRestaurant,
})

export async function updateRestaurant(payload: UpdateRestaurantRequest): Promise<OwnRestaurant> {
  return send((client) => client.PATCH('/api/v1/restaurant', { body: payload }))
}
