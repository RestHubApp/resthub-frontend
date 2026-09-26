import { useMutation, useQueryClient } from '@tanstack/react-query'

import { changeReservationStatus, reservationsQueryKey, saveReservation } from '../../api/reservations'
import type { ReservationRequest, ReservationStatus } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

/** Guardar una reserva (nueva o editada). El error lo muestra el formulario. */
export function useSaveReservation(reservationId: number | undefined, onDone: () => void) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: (payload: ReservationRequest) => saveReservation(payload, reservationId),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: reservationsQueryKey })
      push({ tone: 'info', message: `Reserva de ${saved.customer_name} guardada.` })
      onDone()
    },
  })
}

/** Llegaron, no vinieron o se canceló. */
export function useReservationStatus() {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) => changeReservationStatus(id, status),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: reservationsQueryKey })
      push({ tone: 'info', message: `${saved.customer_name}: ${saved.status_label}.` })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo cambiar la reserva.') })
    },
  })
}
