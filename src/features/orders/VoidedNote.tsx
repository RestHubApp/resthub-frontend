import type { OrderItemResponse } from '@/api/types'
import { Icon } from '@/components/Icon'

interface VoidedNoteProps {
  readonly item: OrderItemResponse
}

/** «Anulado: Sin insumo», debajo de un plato anulado: el tachado solo no dice por qué. */
export function VoidedNote({ item }: VoidedNoteProps) {
  return (
    <p className="m-0 mt-1 flex items-start gap-1.5 text-sm font-semibold text-foreground">
      <Icon name="cancel" size={16} className="mt-0.5 shrink-0" />
      <span className="min-w-0 flex-1 break-words">Anulado: {item.void_reason ?? ''}</span>
    </p>
  )
}
