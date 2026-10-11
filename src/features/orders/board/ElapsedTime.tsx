import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { formatMinutes, minutesSince } from '@/services/format'

interface ElapsedTimeProps {
  readonly order: OrderResponse
  readonly now: number
}

// Minutos a partir de los que un pedido en cocina, o listo sin servir, pide atencion.
const WARN_MINUTES = 15
const LATE_MINUTES = 25

/**
 * Cuanto lleva el pedido en el estado en que esta.
 *
 * En cocina y listo se mide desde que entro a ese estado (`status_changed_at`,
 * que no cambia al editar una nota); abierto y servido, desde que se abrio. Pasados 15 minutos se tine
 * de ambar y pasados 25 se marca "Demorado", con texto y no solo con color.
 */
export function ElapsedTime({ order, now }: ElapsedTimeProps) {
  const watched = order.status === 'in_kitchen' || order.status === 'ready'
  const minutes = minutesSince(watched ? order.status_changed_at : order.created_at, now)
  const late = watched && minutes >= LATE_MINUTES
  const alert = watched && minutes >= WARN_MINUTES

  let tone = 'bg-muted text-muted-foreground'
  if (late) {
    tone = 'bg-destructive text-white'
  } else if (alert) {
    tone = 'bg-warning/15 text-warning'
  }

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>
      <Icon name={late ? 'alerta' : 'horario'} size={14} />
      <span>
        {late ? 'Demorado · ' : ''}
        {formatMinutes(minutes)}
      </span>
    </span>
  )
}
