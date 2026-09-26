import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { addPayment } from '../../../api/orders'
import type { OrderResponse, PaymentRequest } from '../../../api/types'
import { decimalParaApi } from '../../../components/formRules'
import { centsToApi, formatMoney } from '../../../services/format'
import { useOrderAction } from '../useOrderAction'
import { balanceCents, chargeCents, type SplitMode } from './chargeMath'
import { chargeSchema, type ChargeValues } from './chargeSchema'

// Una cuenta dividida arranca entre dos: es el caso más común.
const PERSONAS_INICIALES = 2

/** Cómo se divide este pago: el modo, lo que se cobra y los platos elegidos. */
interface Split {
  readonly modo: SplitMode
  readonly parte: number
  readonly platos: readonly number[]
}

function payloadFor(order: OrderResponse, valores: ChargeValues, { modo, parte, platos }: Split): PaymentRequest {
  const efectivo = valores.payment_method === 'cash'
  const base: PaymentRequest = {
    payment_method: valores.payment_method,
    amount_received: efectivo ? decimalParaApi(valores.amount_received) : null,
    tip: decimalParaApi(valores.tip) ?? '0',
    // El saldo que ve quien cobra: si cambió (otro pago, un doble toque), el
    // servidor no cobra dos veces.
    expected_balance: order.balance,
  }
  if (modo === 'items') {
    return { ...base, item_ids: [...platos] }
  }
  if (modo === 'equal' && parte < balanceCents(order)) {
    return { ...base, amount: centsToApi(parte) }
  }
  return base
}

function partialMessage(order: OrderResponse): string {
  return order.status === 'paid'
    ? `Pedido #${String(order.number)} pagado.`
    : `Pago registrado. Faltan ${formatMoney(order.balance)}.`
}

/**
 * El pago que se está armando: cómo se divide la cuenta, el medio, la propina
 * y lo que entregó el cliente.
 *
 * Tras un pago parcial el formulario queda listo para la persona siguiente;
 * cuando la cuenta se cierra, avisa con `onPaid`.
 */
export function usePaymentForm(order: OrderResponse, onPaid: (order: OrderResponse) => void) {
  const [modo, setModo] = useState<SplitMode>('all')
  const [personas, setPersonas] = useState(PERSONAS_INICIALES)
  const [platos, setPlatos] = useState<number[]>([])
  const parte = chargeCents(order, modo, personas, platos)
  const form = useForm<ChargeValues>({
    resolver: zodResolver(chargeSchema(parte)),
    defaultValues: { payment_method: 'cash', amount_received: '', tip: '' },
  })
  const pago = useOrderAction({
    mutationFn: (payload: PaymentRequest) => addPayment(order.id, payload),
    success: partialMessage,
    failure: 'No se pudo registrar el pago.',
    onSuccess: (pagado) => {
      if (pagado.status === 'paid') {
        onPaid(pagado)
        return
      }
      form.reset({ payment_method: form.getValues('payment_method'), amount_received: '', tip: '' })
      setPlatos([])
      setPersonas((antes) => Math.max(antes - 1, 1))
    },
  })
  const sinPlatos = modo === 'items' && platos.length === 0

  return {
    form,
    modo,
    setModo,
    personas,
    setPersonas,
    platos,
    setPlatos,
    parte,
    pago,
    puedeCobrar: !sinPlatos && !pago.isPending,
    enviar: form.handleSubmit((valores) => {
      pago.mutate(payloadFor(order, valores, { modo, parte, platos }))
    }),
  }
}
