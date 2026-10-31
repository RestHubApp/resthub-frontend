import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { formatMinutes, minutesSince } from '@/services/format'
import { elapsedLevel, TONE_BY_LEVEL } from './elapsedTone'

interface ElapsedTimeProps {
  readonly order: OrderResponse
  readonly now: number
}

/**
 * Cuanto lleva el pedido en el estado en que esta.
 *
 * En cocina y listo se mide desde que entro a ese estado (`status_changed_at`,
 * que no cambia al editar una nota); abierto y servido, desde que se abrio. Pasados 15 minutos se tine
 * de ambar y pasados 25 se marca "Demorado", con texto y no solo con color.
 */
export function ElapsedTime({ order, now }: ElapsedTimeProps) {
  const isWatched = order.status === 'in_kitchen' || order.status === 'ready'
  const minutes = minutesSince(isWatched ? order.status_changed_at : order.created_at, now)
  const level = elapsedLevel(isWatched, minutes)
  const isLate = level === 'late'

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${TONE_BY_LEVEL[level]}`}>
      <Icon glyph={isLate ? icons.alert : icons.schedule} size={14} />
      <span>
        {isLate ? 'Demorado · ' : ''}
        {formatMinutes(minutes)}
      </span>
    </span>
  )
}
