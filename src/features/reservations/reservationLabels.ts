import type { ReservationStatus } from '@/api/types'
import type { StatusTone } from '@/components/StatusBadge'

/** El tono de la etiqueta de estado de una reserva. */
export const STATUS_TONE: Record<ReservationStatus, StatusTone | undefined> = {
  booked: 'pending',
  seated: 'completed',
  cancelled: 'cancelled',
  no_show: 'cancelled',
}
