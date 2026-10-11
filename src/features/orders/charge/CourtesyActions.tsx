import type { OrderItemResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface CourtesyActionsProps {
  readonly item: OrderItemResponse
  readonly isPending: boolean
  /** Hay un motivo abierto: no se puede abrir otro. */
  readonly isReasonOpen: boolean
  readonly onRevoke: () => void
  readonly onInvite: () => void
}

/** El botón de un plato: volver a cobrarlo si es cortesía, o empezar a invitarlo. */
export function CourtesyActions({ item, isPending, isReasonOpen, onRevoke, onInvite }: CourtesyActionsProps) {
  if (item.is_courtesy) {
    return (
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={onRevoke}>
        Cobrar
      </Button>
    )
  }
  return (
    <Button type="button" size="sm" variant="outline" disabled={isReasonOpen} onClick={onInvite}>
      <Icon name="courtesy" size={14} />
      <span>Invitar</span>
    </Button>
  )
}
