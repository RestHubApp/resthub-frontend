import type { Reservation, ReservationStatus } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/services/format'
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

const ACTIONS: readonly { status: ReservationStatus; label: string; variant: 'default' | 'outline' | 'ghost' }[] = [
  { status: 'seated', label: 'Llegaron', variant: 'default' },
  { status: 'no_show', label: 'No vinieron', variant: 'outline' },
  { status: 'cancelled', label: 'Cancelar', variant: 'ghost' },
]

/** Una reserva del día: hora, a nombre de quién, cuántos, mesa y qué hacer. */
export function ReservationRow({ reservation, tableLabel, timeZone, canManage, busy, onEdit, onStatus }: ReservationRowProps) {
  const isPending = reservation.status === 'booked'
  const detail = [
    `${String(reservation.party_size)} personas`,
    tableLabel ?? 'sin mesa',
    reservation.phone,
    reservation.notes,
  ].filter((data) => data !== '')

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-3 ring-1 ring-input">
      <span className="flex items-start gap-3">
        <span className="min-w-14 text-lg font-bold tabular-nums">{formatTime(reservation.reserved_for, timeZone)}</span>
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {reservation.customer_name}
            <StatusBadge label={reservation.status_label} tone={STATUS_TONE[reservation.status]} />
          </span>
          <span className="text-xs text-muted-foreground">{detail.join(' · ')}</span>
        </span>
      </span>
      {canManage && isPending ? (
        <span className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <Button key={action.status} type="button" size="sm" variant={action.variant} disabled={busy} onClick={() => {
              onStatus(action.status)
            }}>
              {action.label}
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
