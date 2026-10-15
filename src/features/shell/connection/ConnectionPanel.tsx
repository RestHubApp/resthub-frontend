import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ShellIcon } from '@/features/shell/ShellIcon'
import { pendingText, STATE_COPY, stateDetail } from './connectionCopy'
import type { Connection } from './useConnection'

interface ConnectionPanelProps {
  readonly connection: Connection
}

/** El contenido del panel de «Conexión en vivo»: el estado en palabras y la cola, con su reintento. */
export function ConnectionPanel({ connection: { state, live, pending, retry } }: ConnectionPanelProps) {
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
        <ShellIcon name={copy.icon} size={18} />
        <span>{copy.label}</span>
      </p>
      <p className="m-0 text-sm text-muted-foreground">{stateDetail(state, live)}</p>
      {pending.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm">
            {pendingText(pending.length)}: {pending.map((order) => order.label).join(', ')}.
          </p>
          <Button type="button" variant="outline" className="self-start" disabled={isSending} onClick={() => void retryNow()}>
            <ShellIcon name="retry" size={16} />
            <span>{isSending ? 'Reintentando…' : 'Reintentar ahora'}</span>
          </Button>
        </div>
      ) : null}
    </>
  )
}
