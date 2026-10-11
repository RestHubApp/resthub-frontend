import { useState } from 'react'

import { receivePurchaseOrder } from '@/api/purchasing'
import type { PurchaseOrder } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney, formatQuantity } from '@/services/format'
import { usePurchasingMutation } from './usePurchasingMutation'

interface ReceiveOrderDialogProps {
  /** La orden que llegó; `null` cierra la ventana. */
  readonly order: PurchaseOrder | null
  readonly onClose: () => void
}

type Received = Readonly<Partial<Record<number, { quantity: string; unitCost: string }>>>

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const NUMBER = /^\d+(?:[.,]\d+)?$/u

function initial(order: PurchaseOrder): Received {
  return Object.fromEntries(
    order.lines.map((line) => [line.id, { quantity: line.quantity, unitCost: line.unit_cost }]),
  )
}

/**
 * Recibir la mercadería: cuánto llegó de cada insumo y a qué precio real.
 *
 * Arranca con lo pedido; se corrige lo que llegó distinto. Lo recibido entra
 * al stock como compras y pondera el costo de cada insumo.
 */
export function ReceiveOrderDialog({ order, onClose }: ReceiveOrderDialogProps) {
  const [received, setReceived] = useState<Received | null>(null)
  const receive = usePurchasingMutation({
    mutationFn: (payload: { orderId: number; lines: { line_id: number; quantity: string; unit_cost: string }[] }) =>
      receivePurchaseOrder(payload.orderId, { lines: payload.lines }),
    success: (receivedOrder) => `Orden ${String(receivedOrder.number)} recibida: ${formatMoney(receivedOrder.received_total)} entraron al stock.`,
    failure: 'No se pudo recibir la orden.',
    onSuccess: () => {
      setReceived(null)
      onClose()
    },
  })
  if (order === null) {
    return null
  }
  const values = received ?? initial(order)
  const lines = order.lines.map((line) => ({
    line_id: line.id,
    quantity: (values[line.id]?.quantity ?? '0').replace(',', '.'),
    unit_cost: (values[line.id]?.unitCost ?? '0').replace(',', '.'),
  }))
  const valid = lines.every((line) => NUMBER.test(line.quantity) && NUMBER.test(line.unit_cost))

  return (
    <FormDialog open title={`Recibir la orden ${String(order.number)}`} description={order.supplier_name} onOpenChange={(open) => {
      if (!open) {
        setReceived(null)
        onClose()
      }
    }}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.lines.map((line) => (
          <li key={line.id} className="grid grid-cols-[1fr_7rem_7rem] items-center gap-2 text-sm">
            <span>
              {line.ingredient_name}
              <span className="block text-xs text-muted-foreground">Pedido: {formatQuantity(line.quantity, line.unit ?? '')}</span>
            </span>
            <Input aria-label={`Cantidad recibida de ${line.ingredient_name}`} inputMode="decimal" value={values[line.id]?.quantity ?? ''} onChange={(event) => {
              setReceived({ ...values, [line.id]: { quantity: event.target.value, unitCost: values[line.id]?.unitCost ?? '0' } })
            }} />
            <Input aria-label={`Costo real por unidad de ${line.ingredient_name}`} inputMode="decimal" value={values[line.id]?.unitCost ?? ''} onChange={(event) => {
              setReceived({ ...values, [line.id]: { quantity: values[line.id]?.quantity ?? '0', unitCost: event.target.value } })
            }} />
          </li>
        ))}
      </ul>
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="success" disabled={!valid || receive.isPending} onClick={() => {
          receive.mutate({ orderId: order.id, lines })
        }}>
          {receive.isPending ? 'Recibiendo…' : 'Recibir y cargar al stock'}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
