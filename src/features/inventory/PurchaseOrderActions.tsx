import type { PurchaseOrder } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface PurchaseOrderActionsProps {
  readonly status: PurchaseOrder['status']
  /** Hay un cambio de la orden en curso: bloquea enviar y cancelar. */
  readonly isBusy: boolean
  readonly onSend: () => void
  readonly onReceive: () => void
  readonly onCancel: () => void
}

/** Lo que se puede hacer con una orden abierta: marcarla enviada, recibirla o cancelarla. */
export function PurchaseOrderActions({ status, isBusy, onSend, onReceive, onCancel }: PurchaseOrderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' ? (
        <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={onSend}>
          <Icon name="send" size={14} />
          <span>Marcar enviada</span>
        </Button>
      ) : null}
      <Button type="button" size="sm" onClick={onReceive}>
        <Icon name="purchase" size={14} />
        <span>Recibir</span>
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={isBusy} onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  )
}
