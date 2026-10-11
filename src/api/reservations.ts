import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { Reservation, ReservationRequest, ReservationStatus } from './types'

// Reservas de mesa, por día del restaurante.

export const reservationsQueryKey = ['reservations'] as const

export function reservationsOfDayQuery(day: string) {
  return queryOptions({
    queryKey: [...reservationsQueryKey, day],
    queryFn: () => send((client) => client.GET('/api/v1/reservations', { params: { query: { day } } })),
  })
}

export async function saveReservation(
  payload: ReservationRequest,
  reservationId?: number,
): Promise<Reservation> {
  if (reservationId === undefined) {
    return send((client) => client.POST('/api/v1/reservations', { body: payload }))
  }
  return send((client) =>
    client.PUT('/api/v1/reservations/{reservation_id}', {
      params: { path: { reservation_id: reservationId } },
      body: payload,
    }),
  )
}

export async function changeReservationStatus(
  reservationId: number,
  status: ReservationStatus,
): Promise<Reservation> {
  return send((client) =>
    client.POST('/api/v1/reservations/{reservation_id}/status', {
      params: { path: { reservation_id: reservationId }, query: { value: status } },
    }),
  )
}
