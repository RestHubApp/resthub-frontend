import { useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import type { Reservation } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { todayIn } from '@/services/format'
import { useCan, useTimeZone } from '@/store/session'
import { ReservationDayCard } from './ReservationDayCard'
import { ReservationDialog } from './ReservationDialog'

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
  const [editing, setEditing] = useState<Editing>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reservas"
        description="Quién viene, a qué hora y en qué mesa."
        actions={canManage ? (
          <Button type="button" onClick={() => {
            setEditing({ reservation: null })
          }}>
            <Icon glyph={icons.add} size={18} />
            <span>Nueva reserva</span>
          </Button>
        ) : undefined}
      />
      <ReservationDayCard
        day={day}
        timeZone={timeZone}
        canManage={canManage}
        onDayChange={setDay}
        onEdit={(reservation) => {
          setEditing({ reservation })
        }}
      />
      <ReservationDialog open={editing !== null} reservation={editing?.reservation ?? null} day={day} onClose={() => {
        setEditing(null)
      }} />
    </div>
  )
}
