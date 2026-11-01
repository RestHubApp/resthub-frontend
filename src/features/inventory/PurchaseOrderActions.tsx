import type { PurchaseOrder } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'

interface PurchaseOrderActionsProps {
  readonly status: PurchaseOrder['status']
  /** El número de la orden, para la confirmación. */
  readonly number: number
  /** Hay un cambio de la orden en curso: bloquea enviar y cancelar. */
  readonly isBusy: boolean
  readonly onSend: () => void
  readonly onReceive: () => void
  readonly onCancel: () => void
}

/**
 * Lo que se puede hacer con una orden abierta: marcarla enviada, recibirla o
 * cancelarla. Cancelar no se deshace (una orden cancelada ya no se recibe), así
 * que se confirma antes.
 */
export function PurchaseOrderActions({ status, number, isBusy, onSend, onReceive, onCancel }: PurchaseOrderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' ? (
        <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={onSend}>
          <Icon glyph={icons.send} size={14} />
          <span>Marcar enviada</span>
        </Button>
      ) : null}
      <Button type="button" size="sm" onClick={onReceive}>
        <Icon glyph={icons.purchase} size={14} />
        <span>Recibir</span>
      </Button>
      <ConfirmDialog
        trigger={(
          <Button type="button" size="sm" variant="ghost" disabled={isBusy}>
            Cancelar orden
          </Button>
        )}
        title={`¿Cancelar la OC ${String(number)}?`}
        description="Una orden cancelada ya no se puede recibir: lo que llegue habrá que cargarlo como compra."
        confirmLabel="Cancelar orden"
        cancelLabel="Volver"
        onConfirm={onCancel}
      />
    </div>
  )
}
