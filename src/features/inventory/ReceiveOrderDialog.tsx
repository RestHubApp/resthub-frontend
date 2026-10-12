import type { PurchaseOrder } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { FormDialog } from '@/components/FormDialog'
import { ReceiveLineRow } from './ReceiveLineRow'
import { useReceiveOrder } from './useReceiveOrder'

interface ReceiveOrderDialogProps {
  /** La orden que llegó; `null` cierra la ventana. */
  readonly order: PurchaseOrder | null
  readonly onClose: () => void
}

/**
 * Recibir la mercadería: cuánto llegó de cada insumo y a qué precio real.
 *
 * Arranca con lo pedido; se corrige lo que llegó distinto. Lo recibido entra
 * al stock como compras y pondera el costo de cada insumo.
 */
export function ReceiveOrderDialog({ order, onClose }: ReceiveOrderDialogProps) {
  const receive = useReceiveOrder(order, onClose)
  if (order === null) {
    return null
  }

  return (
    <FormDialog
      open
      title={`Recibir la orden ${String(order.number)}`}
      description={order.supplier_name}
      onOpenChange={(open) => {
        if (!open) {
          receive.close()
        }
      }}
    >
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.lines.map((line) => (
          <ReceiveLineRow
            key={line.id}
            line={line}
            quantity={receive.values[line.id]?.quantity ?? ''}
            unitCost={receive.values[line.id]?.unitCost ?? ''}
            onQuantity={(quantity) => {
              receive.edit(line.id, { quantity })
            }}
            onUnitCost={(unitCost) => {
              receive.edit(line.id, { unitCost })
            }}
          />
        ))}
      </ul>
      <FormFooter
        mutation={receive}
        onCancel={onClose}
        submit={{
          label: 'Recibir y cargar al stock',
          pendingLabel: 'Recibiendo…',
          variant: 'success',
          onClick: receive.submit,
          isDisabled: !receive.isValid,
        }}
      />
    </FormDialog>
  )
}
