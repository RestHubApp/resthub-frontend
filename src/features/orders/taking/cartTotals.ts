import type { DraftLine } from './useOrderDraft'
import { formatCents, toCents } from '../../../services/format'
import { dishCount } from '../orderLabels'

/** Cuantos platos y cuanto suman, ya formateados. */
export function cartTotals(lines: readonly DraftLine[]) {
  const platos = lines.reduce((total, line) => total + line.quantity, 0)
  const centimos = lines.reduce((total, line) => total + toCents(line.unitPrice) * line.quantity, 0)
  return { platos, count: dishCount(platos), total: formatCents(centimos) }
}
