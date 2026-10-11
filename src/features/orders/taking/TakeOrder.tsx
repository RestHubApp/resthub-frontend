import type { ReactNode } from 'react'

import { useLiveUpdates } from '@/features/orders/useLiveUpdates'
import { BackLink } from '@/components/BackLink'
import { MenuPicker } from './MenuPicker'
import { backPath, draftKey, type OrderTarget } from './orderTarget'
import { useDraftActions, useDraftLines } from './useOrderDraft'
import { TakeOrderCart } from './TakeOrderCart'
import { useSubmitDraft } from './useSubmitDraft'

interface TakeOrderProps {
  readonly target: OrderTarget
  readonly title: string
  readonly description: string
  /** Un aviso sobre el destino, como una mesa que otro mesero acaba de ocupar. */
  readonly notice?: ReactNode
}

/**
 * Elegir platos y mandarlos, en cuatro toques o menos.
 *
 * Mesa, plato, plato, "Enviar a cocina": el pedido se crea recien al enviarlo,
 * asi una mesa no queda ocupada por un pedido vacio si el cliente se arrepiente.
 * Las notas y las cantidades finas se ajustan en el resumen, que es opcional.
 */
export function TakeOrder({ target, title, description, notice }: TakeOrderProps) {
  useLiveUpdates()
  const key = draftKey(target)
  const lines = useDraftLines(key)
  const { add, setQuantity, setNotes } = useDraftActions()
  const send = useSubmitDraft(target, title)
  const submitLabel = target.kind === 'add' ? 'Agregar al pedido' : 'Enviar a cocina'

  return (
    <div className="flex flex-col gap-5 pb-20 lg:pb-24">
      <header className="flex flex-col gap-1">
        <BackLink to={backPath(target)} />
        <h1 className="m-0 font-heading text-2xl leading-tight font-bold text-primary sm:text-3xl">
          {title}
        </h1>
        <p className="m-0 text-muted-foreground">{description}</p>
      </header>
      {notice}
      <MenuPicker
        lines={lines}
        onAdd={(item, modifiers) => {
          add(key, item, modifiers)
        }}
        onChange={(lineKey, quantity) => {
          setQuantity(key, lineKey, quantity)
        }}
      />
      <TakeOrderCart
        title={title}
        lines={lines}
        submitLabel={submitLabel}
        pending={send.isPending}
        onQuantity={(lineKey, quantity) => {
          setQuantity(key, lineKey, quantity)
        }}
        onNotes={(lineKey, notes) => {
          setNotes(key, lineKey, notes)
        }}
        onSend={() => {
          send.mutate(lines)
        }}
      />
    </div>
  )
}
