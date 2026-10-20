import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'

import { tablesQuery } from '@/api/tables'
import type { Reservation } from '@/api/types'
import { SaveFormDialog } from '@/components/SaveFormDialog'
import { useAppForm } from '@/hooks/useAppForm'
import { useTimeZone } from '@/store/session'
import { ReservationFields } from './ReservationFields'
import { reservationDefaults, reservationRequest, reservationSchema, type ReservationValues } from './reservationSchema'
import { useSaveReservation } from './useReservationMutations'

interface ReservationDialogProps {
  readonly open: boolean
  readonly reservation: Reservation | null
  /** El día que se está mirando: el de una reserva nueva. */
  readonly day: string
  readonly onClose: () => void
}

/**
 * Tomar o corregir una reserva.
 *
 * La mesa es opcional: si se elige, el servidor revisa que no choque con otra
 * reserva de esa mesa en el mismo horario.
 */
export function ReservationDialog({ open, reservation, day, onClose: handleClose }: ReservationDialogProps) {
  const timeZone = useTimeZone()
  const tables = useQuery({ ...tablesQuery(false), enabled: open })
  const form = useAppForm<ReservationValues>({
    resolver: zodResolver(reservationSchema),
    values: reservationDefaults(reservation, day, timeZone),
  })
  // Al guardar, la ventana se cierra sin pasar por `onOpenChange` y el
  // formulario conservaba lo escrito: «Nueva reserva» volvía a abrir con el
  // teléfono, las personas y la mesa de la anterior. Cada vez que se abre,
  // vuelve a sus valores al cerrarse.
  const { reset } = form
  const onClose = () => {
    reset(reservationDefaults(reservation, day, timeZone))
    handleClose()
  }
  const save = useSaveReservation(reservation?.id, onClose)

  return (
    <SaveFormDialog
      open={open}
      title={reservation === null ? 'Nueva reserva' : `Reserva de ${reservation.customer_name}`}
      onClose={onClose}
      save={save}
      failureText="No se pudo guardar la reserva."
      handleSubmit={form.handleSubmit((values) => save.mutateAsync(reservationRequest(values, timeZone)).catch(() => undefined))}
    >
      <ReservationFields form={form} tables={tables.data ?? []} />
    </SaveFormDialog>
  )
}
