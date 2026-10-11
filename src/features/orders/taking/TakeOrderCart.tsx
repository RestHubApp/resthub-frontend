import { useState } from 'react'

import { CartBar } from './CartBar'
import { CartSheet } from './CartSheet'
import type { DraftLine } from './useOrderDraft'

interface TakeOrderCartProps {
  readonly title: string
  readonly lines: readonly DraftLine[]
  readonly submitLabel: string
  readonly pending: boolean
  readonly onQuantity: (lineKey: string, quantity: number) => void
  readonly onNotes: (lineKey: string, notes: string) => void
  /** Manda el borrador; antes se cierra el resumen. */
  readonly onSend: () => void
}

/** La barra del pedido al pie y el resumen que sube desde abajo, con el mismo boton de enviar. */
export function TakeOrderCart({ title, lines, submitLabel, pending, onQuantity, onNotes, onSend }: TakeOrderCartProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const submit = () => {
    setIsSummaryOpen(false)
    onSend()
  }

  return (
    <>
      <CartBar
        lines={lines}
        submitLabel={submitLabel}
        pending={pending}
        onOpen={() => {
          setIsSummaryOpen(true)
        }}
        onSubmit={submit}
      />
      <CartSheet
        open={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        title={`Resumen · ${title}`}
        lines={lines}
        onQuantity={onQuantity}
        onNotes={onNotes}
        submitLabel={submitLabel}
        pending={pending}
        onSubmit={submit}
      />
    </>
  )
}
