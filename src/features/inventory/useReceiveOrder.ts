import { useState } from 'react'

import { purchaseOrdersQuery, receivePurchaseOrder } from '@/api/purchasing'
import type { PurchaseOrder } from '@/api/types'
import { formatMoney } from '@/services/format'
import { hasInvalidLineNumber } from './lineNumbers'
import { areReceivedLinesValid, initialReceived, type Received, receivedLines, type ReceivedLine } from './receiveLines'
import { usePurchasingMutation } from './usePurchasingMutation'

interface ReceivePayload {
  readonly orderId: number
  readonly lines: ReceivedLine[]
}

/**
 * Recibir una orden: lo escrito por línea y el envío al servidor.
 *
 * Mientras no se escribe nada, los valores son los de lo pedido.
 */
export function useReceiveOrder(order: PurchaseOrder | null, onClose: () => void) {
  // El borrador va atado a su orden: nunca se aplica a otra que se abra después.
  const [received, setReceived] = useState<{ readonly orderId: number; readonly values: Received } | null>(null)
  const close = () => {
    setReceived(null)
    onClose()
  }
  const receive = usePurchasingMutation({
    mutationFn: (payload: ReceivePayload) => receivePurchaseOrder(payload.orderId, { lines: payload.lines }),
    success: (receivedOrder) => `Orden ${String(receivedOrder.number)} recibida: ${formatMoney(receivedOrder.received_total)} entraron al stock.`,
    failure: 'No se pudo recibir la orden.',
    onSuccess: close,
    invalidateOnError: [purchaseOrdersQuery.queryKey],
  })
  const draft = order !== null && received?.orderId === order.id ? received.values : null
  const values = order === null ? {} : (draft ?? initialReceived(order))
  const lines = order === null ? [] : receivedLines(order, values)

  return {
    values,
    isValid: areReceivedLinesValid(lines),
    hasInvalidNumbers: hasInvalidLineNumber(lines.map((line) => ({ quantity: line.quantity, cost: line.unit_cost }))),
    isPending: receive.isPending,
    close,
    edit: (lineId: number, change: Partial<{ quantity: string; unitCost: string }>) => {
      if (order === null) {
        return
      }
      const current = values[lineId]
      setReceived({
        orderId: order.id,
        values: { ...values, [lineId]: { quantity: current?.quantity ?? '0', unitCost: current?.unitCost ?? '0', ...change } },
      })
    },
    submit: () => {
      if (order !== null) {
        receive.mutate({ orderId: order.id, lines })
      }
    },
  }
}
