import { z } from 'zod'

import { toCents } from '../format'

const MONTO = /^\d{1,6}(?:[.,]\d{1,2})?$/u

export function amountCents(value: string): number | null {
  const limpio = value.trim()
  return MONTO.test(limpio) ? toCents(limpio.replace(',', '.')) : null
}

/**
 * El cobro: medio de pago y, en efectivo, cuanto entrego el cliente.
 *
 * Vacio en efectivo es pago exacto, como lo entiende el servidor. Un monto
 * menor al total se rechaza aca para no esperar el 422.
 */
export function chargeSchema(totalCents: number) {
  return z
    .object({
      payment_method: z.enum(['cash', 'yape', 'plin', 'card', 'transfer'], 'Elige el medio de pago'),
      amount_received: z.string().trim(),
    })
    .superRefine((valores, ctx) => {
      if (valores.payment_method !== 'cash' || valores.amount_received === '') {
        return
      }
      const cents = amountCents(valores.amount_received)
      if (cents === null) {
        ctx.addIssue({ code: 'custom', path: ['amount_received'], message: 'Escribe un monto como 100 o 100.50' })
      } else if (cents < totalCents) {
        ctx.addIssue({ code: 'custom', path: ['amount_received'], message: 'El monto no cubre el total' })
      }
    })
}

export type ChargeValues = z.infer<ReturnType<typeof chargeSchema>>
