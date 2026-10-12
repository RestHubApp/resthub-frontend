import { z } from 'zod'
import { toCents } from '@/services/format'


// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const AMOUNT = /^\d{1,6}(?:[.,]\d{1,2})?$/u
const FORMAT = 'Escribe un monto como 100 o 100.50'

export function amountCents(value: string): number | null {
  const clean = value.trim()
  return AMOUNT.test(clean) ? toCents(clean.replace(',', '.')) : null
}

/** La propina en céntimos; vacía es cero y un texto que no es monto, `null`. */
export function tipCents(value: string): number | null {
  return value.trim() === '' ? 0 : amountCents(value)
}

/**
 * El pago: medio, propina y, en efectivo, cuánto entregó el cliente.
 *
 * `chargeCents` es lo que se cobra de la cuenta en este pago. En efectivo, lo
 * entregado tiene que cubrirlo junto con la propina; vacío es pago exacto,
 * como lo entiende el servidor. Se valida acá para no esperar el 422.
 */
export function chargeSchema(chargeCents: number) {
  return z
    .object({
      payment_method: z.enum(['cash', 'yape', 'plin', 'card', 'transfer'], 'Elige el medio de pago'),
      amount_received: z.string().trim(),
      tip: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      const tip = tipCents(values.tip)
      if (tip === null) {
        ctx.addIssue({ code: 'custom', path: ['tip'], message: FORMAT })
        return
      }
      if (values.payment_method !== 'cash' || values.amount_received === '') {
        return
      }
      const cents = amountCents(values.amount_received)
      if (cents === null) {
        ctx.addIssue({ code: 'custom', path: ['amount_received'], message: FORMAT })
      } else if (cents < chargeCents + tip) {
        ctx.addIssue({ code: 'custom', path: ['amount_received'], message: 'El monto no cubre lo que se cobra' })
      }
    })
}

export type ChargeValues = z.infer<ReturnType<typeof chargeSchema>>
