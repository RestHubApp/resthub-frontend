import { useQuery } from '@tanstack/react-query'

import { reservationsOfDayQuery } from '@/api/reservations'
import { tableName, tablesQuery } from '@/api/tables'
import type { Reservation } from '@/api/types'
import { SectionCard } from '@/components/SectionCard'
import { Input } from '@/components/ui/input'
import { formatLongDate } from '@/services/format'
import { ReservationListStatus } from './ReservationListStatus'
import { ReservationRow } from './ReservationRow'
import { useReservationStatus } from './useReservationMutations'

interface ReservationDayCardProps {
  readonly day: string
  readonly timeZone: string
  readonly canManage: boolean
  readonly onDayChange: (day: string) => void
  readonly onEdit: (reservation: Reservation) => void
}

/** La tarjeta de un día: el selector de fecha y sus reservas por hora. */
export function ReservationDayCard({ day, timeZone, canManage, onDayChange, onEdit }: ReservationDayCardProps) {
  const reservations = useQuery(reservationsOfDayQuery(day))
  const tables = useQuery(tablesQuery(true))
  const statusMutation = useReservationStatus()
  const list = reservations.data ?? []
  const tableOf = (id: number | null) => {
    const table = tables.data?.find((item) => item.id === id)
    return table === undefined ? null : tableName(table.label)
  }

  return (
    <SectionCard
      title={formatLongDate(day)}
      actions={
        <Input type="date" aria-label="Día" className="w-auto" value={day} onChange={(event) => {
          if (event.target.value !== '') {
            onDayChange(event.target.value)
          }
        }} />
      }
    >
      <ReservationListStatus
        isPending={reservations.isPending}
        isError={reservations.isError}
        isEmpty={reservations.isSuccess && list.length === 0}
        error={reservations.error}
        onRetry={() => {
          void reservations.refetch()
        }}
      />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {list.map((reservation) => (
          <ReservationRow
            key={reservation.id}
            reservation={reservation}
            tableLabel={tableOf(reservation.table_id)}
            timeZone={timeZone}
            canManage={canManage}
            busy={statusMutation.isPending}
            onEdit={() => {
              onEdit(reservation)
            }}
            onStatus={(status) => {
              statusMutation.mutate({ id: reservation.id, status })
            }}
          />
        ))}
      </ul>
    </SectionCard>
  )
}
