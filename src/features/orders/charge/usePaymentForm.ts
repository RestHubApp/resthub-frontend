import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { addPayment } from '@/api/orders'
import type { OrderResponse, PaymentRequest } from '@/api/types'
import { decimalParaApi } from '@/components/formRules'
import { centsToApi, formatMoney } from '@/services/format'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { balanceCents, chargeCents, type SplitMode } from './chargeMath'
import { chargeSchema, type ChargeValues } from './chargeSchema'

// Una cuenta dividida arranca entre dos: es el caso más común.
const INITIAL_PERSONAS = 2

/** Cómo se divide este pago: el modo, lo que se cobra y los platos elegidos. */
interface Split {
  readonly modo: SplitMode
  readonly parte: number
  readonly platos: readonly number[]
}

function payloadFor(order: OrderResponse, values: ChargeValues, { modo: mode, parte: part, platos: dishes }: Split): PaymentRequest {
  const cash = values.payment_method === 'cash'
  const base: PaymentRequest = {
    payment_method: values.payment_method,
    amount_received: cash ? decimalParaApi(values.amount_received) : null,
    tip: decimalParaApi(values.tip) ?? '0',
    // El saldo que ve quien cobra: si cambió (otro pago, un doble toque), el
    // servidor no cobra dos veces.
    expected_balance: order.balance,
  }
  if (mode === 'items') {
    return { ...base, item_ids: [...dishes] }
  }
  if (mode === 'equal' && part < balanceCents(order)) {
    return { ...base, amount: centsToApi(part) }
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
  const [mode, setMode] = useState<SplitMode>('all')
  const [personas, setPersonas] = useState(INITIAL_PERSONAS)
  const [dishes, setDishes] = useState<number[]>([])
  const part = chargeCents(order, mode, personas, dishes)
  const form = useForm<ChargeValues>({
    resolver: zodResolver(chargeSchema(part)),
    defaultValues: { payment_method: 'cash', amount_received: '', tip: '' },
  })
  const payment = useOrderAction({
    mutationFn: (payload: PaymentRequest) => addPayment(order.id, payload),
    success: partialMessage,
    failure: 'No se pudo registrar el pago.',
    onSuccess: (paid) => {
      if (paid.status === 'paid') {
        onPaid(paid)
        return
      }
      form.reset({ payment_method: form.getValues('payment_method'), amount_received: '', tip: '' })
      setDishes([])
      setPersonas((antes) => Math.max(antes - 1, 1))
    },
  })
  const withoutDishes = mode === 'items' && dishes.length === 0

  return {
    form,
    modo: mode,
    setModo: setMode,
    personas,
    setPersonas,
    platos: dishes,
    setPlatos: setDishes,
    parte: part,
    pago: payment,
    puedeCobrar: !withoutDishes && !payment.isPending,
    enviar: form.handleSubmit((values) => {
      payment.mutate(payloadFor(order, values, { modo: mode, parte: part, platos: dishes }))
    }),
  }
}
