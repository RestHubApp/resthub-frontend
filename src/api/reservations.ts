import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Reservation, ReservationRequest, ReservationStatus } from './types'

// Reservas de mesa, por día del restaurante.

export const reservationsQueryKey = ['reservations'] as const

export function reservationsOfDayQuery(day: string) {
  return queryOptions({
    queryKey: [...reservationsQueryKey, day],
    queryFn: async () => {
      const { data } = await api.get<Reservation[]>('/reservations', { params: { day } })
      return data
    },
  })
}

export async function saveReservation(
  payload: ReservationRequest,
  reservationId?: number,
): Promise<Reservation> {
  const { data } =
    reservationId === undefined
      ? await api.post<Reservation>('/reservations', payload)
      : await api.put<Reservation>(`/reservations/${String(reservationId)}`, payload)
  return data
}

export async function changeReservationStatus(
  reservationId: number,
  status: ReservationStatus,
): Promise<Reservation> {
  const { data } = await api.post<Reservation>(
    `/reservations/${String(reservationId)}/status`,
    undefined,
    { params: { value: status } },
  )
  return data
}
