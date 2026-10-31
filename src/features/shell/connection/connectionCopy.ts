import type { IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'
import type { ConnectionState } from './useConnection'

interface StateCopy {
  /** Lo que se lee primero, en el botón y en el panel. */
  readonly label: string
  /** La forma, además del color: el estado no puede depender solo del tono del punto. */
  readonly icon: IconGlyph
  /** El color del punto. */
  readonly dot: string
}

export const STATE_COPY: Record<ConnectionState, StateCopy> = {
  online: { label: 'En línea', icon: icons.online, dot: 'bg-success' },
  reconnecting: { label: 'Reconectando', icon: icons.retry, dot: 'bg-warning' },
  offline: { label: 'Sin conexión', icon: icons.offline, dot: 'bg-destructive' },
}

export function pendingText(count: number): string {
  return count === 1 ? '1 pedido sin enviar' : `${String(count)} pedidos sin enviar`
}

/** El nombre del botón: el estado y, si hay, cuántos pedidos esperan. */
export function connectionLabel(state: ConnectionState, pending: number): string {
  const base = `Conexión en vivo: ${STATE_COPY[state].label.toLowerCase()}`
  return pending > 0 ? `${base}. ${pendingText(pending)}` : base
}
