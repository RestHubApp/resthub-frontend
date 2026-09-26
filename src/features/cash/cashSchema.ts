import { z } from 'zod'

import { textoOpcional } from '../../components/formRules'

// El tope del servidor para la nota de la caja.
export const MAX_CASH_NOTES = 300
const MONTO = /^\d{1,8}(?:[.,]\d{1,2})?$/u
const FORMATO = 'Escribe un monto como 150 o 150.50'

/** Un monto de caja: cero vale (una caja puede abrir sin sencillo). */
function montoDeCaja() {
  return z.string().trim().min(1, 'Escribe el monto').regex(MONTO, FORMATO)
}

export const openCashSchema = z.object({
  opening_amount: montoDeCaja(),
  notes: textoOpcional(MAX_CASH_NOTES),
})

export const closeCashSchema = z.object({
  counted_cash: montoDeCaja(),
  notes: textoOpcional(MAX_CASH_NOTES),
})

export type OpenCashValues = z.infer<typeof openCashSchema>
export type CloseCashValues = z.infer<typeof closeCashSchema>

/** El monto como lo espera el API: con punto decimal. */
export function cashAmountForApi(value: string): string {
  return value.trim().replace(',', '.')
}
