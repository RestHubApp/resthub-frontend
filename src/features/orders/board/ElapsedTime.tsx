import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { formatMinutes, minutesSince } from '../format'

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
 * En cocina y listo se mide desde el ultimo cambio, que es cuando entro a ese
 * estado; abierto y servido, desde que se abrio. Pasados 15 minutos se tine
 * de ambar y pasados 25 se marca "Demorado", con texto y no solo con color.
 */
export default function ElapsedTime({ order, now }: ElapsedTimeProps) {
  const vigilado = order.status === 'in_kitchen' || order.status === 'ready'
  const minutos = minutesSince(vigilado ? order.updated_at : order.created_at, now)
  const tarde = vigilado && minutos >= LATE_MINUTES
  const alerta = vigilado && minutos >= WARN_MINUTES

  let tono = 'bg-muted text-muted-foreground'
  if (tarde) {
    tono = 'bg-destructive text-white'
  } else if (alerta) {
    tono = 'bg-warning/15 text-warning'
  }

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tono}`}>
      <Icon name={tarde ? 'alerta' : 'horario'} size={14} />
      <span>
        {tarde ? 'Demorado · ' : ''}
        {formatMinutes(minutos)}
      </span>
    </span>
  )
}
