import type { LiveStatus } from '@/store/liveStatus'
import type { ShellIconName } from '@/features/shell/ShellIcon'
import type { ConnectionState } from './useConnection'

interface StateCopy {
  /** Lo que se lee primero, en el botón y en el panel. */
  readonly label: string
  /** La forma, además del color: el estado no puede depender solo del tono del punto. */
  readonly icon: ShellIconName
  /** El color del punto. */
  readonly dot: string
}

export const STATE_COPY: Record<ConnectionState, StateCopy> = {
  online: { label: 'En línea', icon: 'online', dot: 'bg-success' },
  reconnecting: { label: 'Reconectando', icon: 'retry', dot: 'bg-warning' },
  offline: { label: 'Sin conexión', icon: 'offline', dot: 'bg-destructive' },
}

/** El estado en una frase sencilla, para el panel. */
export function stateDetail(state: ConnectionState, live: LiveStatus | null): string {
  if (state === 'offline') {
    return 'Este equipo no tiene internet. Los pedidos que tomes se guardan aquí y se envían al volver la señal.'
  }
  if (state === 'reconnecting') {
    return 'Se cortó la actualización en tiempo real y se está volviendo a conectar. Lo que ves puede tener unos segundos de atraso.'
  }
  return live === 'live'
    ? 'Hay internet y la pantalla se actualiza sola, en tiempo real.'
    : 'Hay internet. Pedidos, cocina y el tablero se actualizan solos en tiempo real.'
}

export function pendingText(count: number): string {
  return count === 1 ? '1 pedido sin enviar' : `${String(count)} pedidos sin enviar`
}

/** El nombre del botón: el estado y, si hay, cuántos pedidos esperan. */
export function connectionLabel(state: ConnectionState, pending: number): string {
  const base = `Conexión en vivo: ${STATE_COPY[state].label.toLowerCase()}`
  return pending > 0 ? `${base}. ${pendingText(pending)}` : base
}
