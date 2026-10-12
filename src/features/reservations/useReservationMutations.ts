import { changeReservationStatus, reservationsQueryKey, saveReservation } from '@/api/reservations'
import type { ReservationRequest, ReservationStatus } from '@/api/types'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

/** Guardar una reserva (nueva o editada). El error lo muestra el formulario. */
export function useSaveReservation(reservationId: number | undefined, onDone: () => void) {
  return useNotifiedMutation({
    mutationFn: (payload: ReservationRequest) => saveReservation(payload, reservationId),
    invalidate: [reservationsQueryKey],
    shouldWait: true,
    success: (saved) => `Reserva de ${saved.customer_name} guardada.`,
    onSuccess: onDone,
  })
}

/** Llegaron, no vinieron o se canceló. */
export function useReservationStatus() {
  return useNotifiedMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) => changeReservationStatus(id, status),
    invalidate: [reservationsQueryKey],
    shouldWait: true,
    success: (saved) => `${saved.customer_name}: ${saved.status_label}.`,
    failure: 'No se pudo cambiar la reserva.',
  })
}
