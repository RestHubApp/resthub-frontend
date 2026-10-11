import { useState } from 'react'

import { receivePurchaseOrder } from '@/api/purchasing'
import type { PurchaseOrder } from '@/api/types'
import { formatMoney } from '@/services/format'
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
  const [received, setReceived] = useState<Received | null>(null)
  const close = () => {
    setReceived(null)
    onClose()
  }
  const receive = usePurchasingMutation({
    mutationFn: (payload: ReceivePayload) => receivePurchaseOrder(payload.orderId, { lines: payload.lines }),
    success: (receivedOrder) => `Orden ${String(receivedOrder.number)} recibida: ${formatMoney(receivedOrder.received_total)} entraron al stock.`,
    failure: 'No se pudo recibir la orden.',
    onSuccess: close,
  })
  const values = order === null ? {} : (received ?? initialReceived(order))
  const lines = order === null ? [] : receivedLines(order, values)

  return {
    values,
    isValid: areReceivedLinesValid(lines),
    isPending: receive.isPending,
    close,
    edit: (lineId: number, change: Partial<{ quantity: string; unitCost: string }>) => {
      const current = values[lineId]
      setReceived({
        ...values,
        [lineId]: { quantity: current?.quantity ?? '0', unitCost: current?.unitCost ?? '0', ...change },
      })
    },
    submit: () => {
      if (order !== null) {
        receive.mutate({ orderId: order.id, lines })
      }
    },
  }
}
