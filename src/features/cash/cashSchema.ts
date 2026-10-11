import { z } from 'zod'

import { textOptional } from '@/components/formRules'

// El tope del servidor para la nota de la caja.
export const MAX_CASH_NOTES = 300
// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const AMOUNT = /^\d{1,8}(?:[.,]\d{1,2})?$/u
const FORMAT = 'Escribe un monto como 150 o 150.50'

/** Un monto de caja: cero vale (una caja puede abrir sin sencillo). */
function cashRegisterAmount() {
  return z.string().trim().min(1, 'Escribe el monto').regex(AMOUNT, FORMAT)
}

export const openCashSchema = z.object({
  opening_amount: cashRegisterAmount(),
  notes: textOptional(MAX_CASH_NOTES),
})

export const closeCashSchema = z.object({
  counted_cash: cashRegisterAmount(),
  notes: textOptional(MAX_CASH_NOTES),
})

export type OpenCashValues = z.infer<typeof openCashSchema>
export type CloseCashValues = z.infer<typeof closeCashSchema>

/** El monto como lo espera el API: con punto decimal. */
export function cashAmountForApi(value: string): string {
  return value.trim().replace(',', '.')
}
