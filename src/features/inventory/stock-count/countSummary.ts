import type { StockCount, StockCountSummary } from '@/api/types'
import { formatDateTime } from '@/services/format'

/** «12 de 40 contados». */
export function progressText(count: StockCountSummary): string {
  return `${String(count.counted_lines)} de ${String(count.total_lines)} contados`
}

/** Lo que pasa al cerrar: cuántos se ajustan y cuántos quedan como están. */
export function closeWarning(count: StockCount): string {
  const pending = count.total_lines - count.counted_lines
  const adjusts = `Cada insumo contado se ajusta a lo que contaste (${String(count.counted_lines)}).`
  if (pending === 0) {
    return `${adjusts} No queda ninguno sin contar.`
  }
  const left = pending === 1 ? 'Queda 1 insumo sin contar' : `Quedan ${String(pending)} insumos sin contar`
  return `${adjusts} ${left}: no se ajusta${pending === 1 ? '' : 'n'} y su stock sigue igual.`
}

/** «En curso · 12 de 40 contados · Cierre de mes», o cuándo se cerró. */
export function countDescription(count: StockCountSummary, timeZone: string): string {
  const verb = count.status === 'closed' ? 'cerrado' : 'cancelado'
  const when =
    count.closed_at === null
      ? `empezado el ${formatDateTime(count.created_at, timeZone)}`
      : `${verb} el ${formatDateTime(count.closed_at, timeZone)}`
  return [count.status_label, when, progressText(count), count.note].filter((part) => part !== '').join(' · ')
}
