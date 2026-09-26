import type { Reservation, ReservationStatus } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { Button } from '../../components/ui/button'
import { formatTime } from '../../services/format'
import { STATUS_TONE } from './reservationSchema'

interface ReservationRowProps {
  readonly reservation: Reservation
  readonly tableLabel: string | null
  readonly timeZone: string
  readonly canManage: boolean
  readonly busy: boolean
  readonly onEdit: () => void
  readonly onStatus: (status: ReservationStatus) => void
}

const ACCIONES: readonly { status: ReservationStatus; label: string; variant: 'default' | 'outline' | 'ghost' }[] = [
  { status: 'seated', label: 'Llegaron', variant: 'default' },
  { status: 'no_show', label: 'No vinieron', variant: 'outline' },
  { status: 'cancelled', label: 'Cancelar', variant: 'ghost' },
]

/** Una reserva del día: hora, a nombre de quién, cuántos, mesa y qué hacer. */
export default function ReservationRow({ reservation, tableLabel, timeZone, canManage, busy, onEdit, onStatus }: ReservationRowProps) {
  const pendiente = reservation.status === 'booked'
  const detalle = [
    `${String(reservation.party_size)} personas`,
    tableLabel ?? 'sin mesa',
    reservation.phone,
    reservation.notes,
  ].filter((dato) => dato !== '')

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-3 ring-1 ring-input">
      <span className="flex items-start gap-3">
        <span className="min-w-14 text-lg font-bold tabular-nums">{formatTime(reservation.reserved_for, timeZone)}</span>
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {reservation.customer_name}
            <StatusBadge label={reservation.status_label} tone={STATUS_TONE[reservation.status]} />
          </span>
          <span className="text-xs text-muted-foreground">{detalle.join(' · ')}</span>
        </span>
      </span>
      {canManage && pendiente ? (
        <span className="flex flex-wrap gap-2">
          {ACCIONES.map((accion) => (
            <Button key={accion.status} type="button" size="sm" variant={accion.variant} disabled={busy} onClick={() => {
              onStatus(accion.status)
            }}>
              {accion.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
            Editar
          </Button>
        </span>
      ) : null}
    </li>
  )
}
