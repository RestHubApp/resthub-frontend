import { centsToApi, toCents } from '@/services/format'

// El monto desde el que una merma pide aprobación: soles con hasta dos
// decimales y mayor que cero, o vacío para no pedirla nunca.

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const MONEY = /^\d{1,7}(?:[.,]\d{1,2})?$/u

export function isValidThreshold(text: string): boolean {
  const value = text.trim()
  return value === '' || (MONEY.test(value) && toCents(value.replace(',', '.')) > 0)
}

/** El monto como lo espera el API (`"50.00"`), o `null` para apagar la aprobación. */
export function thresholdForApi(text: string): string | null {
  const value = text.trim()
  return value === '' ? null : centsToApi(toCents(value.replace(',', '.')))
}
