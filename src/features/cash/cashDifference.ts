import { formatCents } from '../../services/format'

/** "Sobran S/ 2.00", "Faltan S/ 4.00" o "Cuadra". */
export function differenceLabel(cents: number): string {
  if (cents === 0) {
    return 'Cuadra'
  }
  return cents > 0 ? `Sobran ${formatCents(cents)}` : `Faltan ${formatCents(-cents)}`
}
