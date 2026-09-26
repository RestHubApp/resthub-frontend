import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { reservationsOfDayQuery } from '../../api/reservations'
import { tableName, tablesQuery } from '../../api/tables'
import type { Reservation } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import ListSkeleton from '../../components/ListSkeleton'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { errorMessage } from '../../services/api'
import { formatLongDate, todayIn } from '../../services/format'
import { useCan, useTimeZone } from '../../store/session'
import ReservationDialog from './ReservationDialog'
import ReservationRow from './ReservationRow'
import { useReservationStatus } from './useReservationMutations'

type Editing = { readonly reservation: Reservation | null } | null

/**
 * Las reservas de un día, por hora.
 *
 * Cuando el grupo llega se marca «Llegaron» y el mesero abre el pedido en la
 * mesa como siempre. Una reserva con mesa asignada no deja reservar esa mesa
 * en el mismo horario.
 */
export default function ReservationsView() {
  const timeZone = useTimeZone()
  const puedeGestionar = useCan('reservations.manage')
  const [dia, setDia] = useState(() => todayIn(timeZone))
  const reservas = useQuery(reservationsOfDayQuery(dia))
  const mesas = useQuery(tablesQuery(true))
  const estado = useReservationStatus()
  const [editando, setEditando] = useState<Editing>(null)
  const lista = reservas.data ?? []
  const mesaDe = (id: number | null) => {
    const mesa = mesas.data?.find((item) => item.id === id)
    return mesa === undefined ? null : tableName(mesa.label)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reservas"
        description="Quién viene, a qué hora y en qué mesa."
        actions={puedeGestionar ? (
          <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
            setEditando({ reservation: null })
          }}>
            <Icon name="agregar" size={18} />
            <span>Nueva reserva</span>
          </Button>
        ) : undefined}
      />
      <SectionCard
        title={formatLongDate(dia)}
        actions={
          <Input type="date" aria-label="Día" className="h-11 w-auto" value={dia} onChange={(event) => {
            if (event.target.value !== '') {
              setDia(event.target.value)
            }
          }} />
        }
      >
        {reservas.isPending ? <ListSkeleton label="Cargando reservas…" count={3} itemClassName="h-16 rounded-lg" /> : null}
        {reservas.isError ? <FormMessage tone="error">{errorMessage(reservas.error, 'No se pudieron cargar.')}</FormMessage> : null}
        {reservas.isSuccess && lista.length === 0 ? <EmptyState title="No hay reservas para este día" /> : null}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {lista.map((reserva) => (
            <ReservationRow
              key={reserva.id}
              reservation={reserva}
              tableLabel={mesaDe(reserva.table_id)}
              timeZone={timeZone}
              canManage={puedeGestionar}
              busy={estado.isPending}
              onEdit={() => {
                setEditando({ reservation: reserva })
              }}
              onStatus={(status) => {
                estado.mutate({ id: reserva.id, status })
              }}
            />
          ))}
        </ul>
      </SectionCard>
      <ReservationDialog open={editando !== null} reservation={editando?.reservation ?? null} day={dia} onClose={() => {
        setEditando(null)
      }} />
    </div>
  )
}
