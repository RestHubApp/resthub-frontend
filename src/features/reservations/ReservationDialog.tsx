import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { tablesQuery } from '../../api/tables'
import type { Reservation } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormDialog from '../../components/FormDialog'
import FormMessage from '../../components/FormMessage'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { useTimeZone } from '../../store/session'
import ReservationFields from './ReservationFields'
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
export default function ReservationDialog({ open, reservation, day, onClose }: ReservationDialogProps) {
  const timeZone = useTimeZone()
  const mesas = useQuery({ ...tablesQuery(false), enabled: open })
  const form = useForm<ReservationValues>({
    resolver: zodResolver(reservationSchema),
    values: reservationDefaults(reservation, day, timeZone),
  })
  const guardar = useSaveReservation(reservation?.id, onClose)

  return (
    <FormDialog
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) {
          guardar.reset()
          onClose()
        }
      }}
      title={reservation === null ? 'Nueva reserva' : `Reserva de ${reservation.customer_name}`}
      size="lg"
    >
      <form
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={onSubmit(form.handleSubmit((values) => guardar.mutateAsync(reservationRequest(values, timeZone)).catch(() => undefined)))}
      >
        <ReservationFields form={form} tables={mesas.data ?? []} />
        {guardar.isError ? (
          <div className="sm:col-span-2">
            <FormMessage tone="error">{errorMessage(guardar.error, 'No se pudo guardar la reserva.')}</FormMessage>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <DialogFormActions>
            <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="h-11 px-4" disabled={guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFormActions>
        </div>
      </form>
    </FormDialog>
  )
}
