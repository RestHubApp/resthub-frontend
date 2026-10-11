import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import { reservationsOfDayQuery } from '@/api/reservations'
import { tableName, tablesQuery } from '@/api/tables'
import type { Reservation } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ListSkeleton } from '@/components/ListSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/services/api'
import { formatLongDate, todayIn } from '@/services/format'
import { useCan, useTimeZone } from '@/store/session'
import { ReservationDialog } from './ReservationDialog'
import { ReservationRow } from './ReservationRow'
import { useReservationStatus } from './useReservationMutations'

type Editing = { readonly reservation: Reservation | null } | null

/**
 * Las reservas de un día, por hora.
 *
 * Cuando el grupo llega se marca «Llegaron» y el mesero abre el pedido en la
 * mesa como siempre. Una reserva con mesa asignada no deja reservar esa mesa
 * en el mismo horario.
 */
export function ReservationsView() {
  const timeZone = useTimeZone()
  const canManage = useCan(PERMISSION.reservationsManage)
  const [day, setDay] = useState(() => todayIn(timeZone))
  const reservations = useQuery(reservationsOfDayQuery(day))
  const tables = useQuery(tablesQuery(true))
  const estado = useReservationStatus()
  const [editing, setEditing] = useState<Editing>(null)
  const list = reservations.data ?? []
  const tableOf = (id: number | null) => {
    const table = tables.data?.find((item) => item.id === id)
    return table === undefined ? null : tableName(table.label)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reservas"
        description="Quién viene, a qué hora y en qué mesa."
        actions={canManage ? (
          <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
            setEditing({ reservation: null })
          }}>
            <Icon name="agregar" size={18} />
            <span>Nueva reserva</span>
          </Button>
        ) : undefined}
      />
      <SectionCard
        title={formatLongDate(day)}
        actions={
          <Input type="date" aria-label="Día" className="h-11 w-auto" value={day} onChange={(event) => {
            if (event.target.value !== '') {
              setDay(event.target.value)
            }
          }} />
        }
      >
        {reservations.isPending ? <ListSkeleton label="Cargando reservas…" count={3} itemClassName="h-16 rounded-lg" /> : null}
        {reservations.isError ? <RetryQueryError message={errorMessage(reservations.error, 'No se pudieron cargar las reservas.')} onRetry={() => { void reservations.refetch() }} /> : null}
        {reservations.isSuccess && list.length === 0 ? <EmptyState title="No hay reservas para este día" /> : null}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {list.map((reservation) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              tableLabel={tableOf(reservation.table_id)}
              timeZone={timeZone}
              canManage={canManage}
              busy={estado.isPending}
              onEdit={() => {
                setEditing({ reservation: reservation })
              }}
              onStatus={(status) => {
                estado.mutate({ id: reservation.id, status })
              }}
            />
          ))}
        </ul>
      </SectionCard>
      <ReservationDialog open={editing !== null} reservation={editing?.reservation ?? null} day={day} onClose={() => {
        setEditing(null)
      }} />
    </div>
  )
}
