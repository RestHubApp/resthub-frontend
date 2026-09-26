import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type { OwnRestaurant, UpdateRestaurantRequest } from './types'

// El restaurante de la cuenta: cualquiera lo lee, el encargado lo edita.

export const restaurantQueryKey = ['restaurant'] as const

export async function fetchRestaurant(): Promise<OwnRestaurant> {
  const { data } = await api.get<OwnRestaurant>('/restaurant')
  return data
}

export const restaurantQuery = queryOptions({
  queryKey: restaurantQueryKey,
  queryFn: fetchRestaurant,
})

export async function updateRestaurant(payload: UpdateRestaurantRequest): Promise<OwnRestaurant> {
  const { data } = await api.patch<OwnRestaurant>('/restaurant', payload)
  return data
}
