import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { useSendQueuedOrders } from '@/store/queuedDelivery'
import type { LiveStatus } from '@/store/liveStatus'
import { pendingText, STATE_COPY } from './connectionCopy'
import type { Connection, ConnectionState } from './useConnection'

interface ConnectionPanelProps {
  readonly connection: Connection
}

// Aquí y no en `connectionCopy`: estas frases solo se leen con el panel abierto.

/** El estado en una frase sencilla, para el panel. */
function stateDetail(state: ConnectionState, live: LiveStatus | null): string {
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

/**
 * El contenido del panel de «Conexión en vivo»: el estado en palabras y la
 * cola, con su reintento. Se baja al abrir el panel: el envío de la cola trae
 * la API de pedidos, que el armazón no necesita para dibujar el botón.
 */
export function ConnectionPanel({ connection: { state, live, pending } }: ConnectionPanelProps) {
  const retry = useSendQueuedOrders()
  const [isSending, setIsSending] = useState(false)
  const copy = STATE_COPY[state]

  const retryNow = async () => {
    setIsSending(true)
    try {
      await retry()
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <p role="status" className="m-0 flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${copy.dot}`} />
        <Icon glyph={copy.icon} size={18} />
        <span>{copy.label}</span>
      </p>
      <p className="m-0 text-sm text-muted-foreground">{stateDetail(state, live)}</p>
      {pending.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm">
            {pendingText(pending.length)}: {pending.map((order) => order.label).join(', ')}.
          </p>
          <Button type="button" variant="outline" className="self-start" disabled={isSending} onClick={() => void retryNow()}>
            <Icon glyph={icons.retry} size={16} />
            <span>{isSending ? 'Reintentando…' : 'Reintentar ahora'}</span>
          </Button>
        </div>
      ) : null}
    </>
  )
}
