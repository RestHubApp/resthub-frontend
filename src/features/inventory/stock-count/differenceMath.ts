import type { CountDifference } from '@/api/types'
import { formatCents, toCents } from '@/services/format'

// Cuándo una diferencia merece mirarse: un 10 % de lo esperado o S/ 20, lo
// que pase primero. Una pizca de sal de más no es noticia; media botella de
// pisco, sí.
const BIG_PERCENT = 10
const BIG_VALUE_CENTS = 2000

/** Si la diferencia es grande, por porcentaje o por plata, para resaltarla. */
export function isBigDifference(line: Pick<CountDifference, 'difference_percent' | 'difference_value'>): boolean {
  const percent = line.difference_percent === null ? 0 : Math.abs(Number(line.difference_percent))
  return percent >= BIG_PERCENT || Math.abs(toCents(line.difference_value)) >= BIG_VALUE_CENTS
}

/** Faltó (pérdida), sobró o cuadró. */
export function differenceTone(value: string): 'loss' | 'gain' | 'even' {
  const cents = toCents(value)
  if (cents < 0) {
    return 'loss'
  }
  return cents > 0 ? 'gain' : 'even'
}

/** «−S/ 10.00»: el signo escrito, también cuando falta. */
export function formatSignedMoney(value: string): string {
  const cents = toCents(value)
  if (cents === 0) {
    return formatCents(0)
  }
  return `${cents < 0 ? '−' : '+'}${formatCents(Math.abs(cents))}`
}
