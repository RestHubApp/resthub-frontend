import type { HourlyCell } from '@/api/types'

export const HEAT_STEPS = 5

export interface HeatmapModel {
  /** De la primera a la última hora con algún pedido en el rango. */
  readonly hours: readonly number[]
  /** Las filas son los días de lunes a domingo; cada una trae sus celdas en el orden de `hours`. */
  readonly rows: readonly { readonly weekday: number; readonly label: string; readonly cells: readonly HourlyCell[] }[]
  readonly max: number
}

/** Recorta las horas en que el local no vendió nada y ordena las celdas en filas. */
export function heatmapModel(cells: readonly HourlyCell[]): HeatmapModel {
  const withSales = cells.filter((cell) => cell.paid_orders > 0)
  if (withSales.length === 0) {
    return { hours: [], rows: [], max: 0 }
  }
  const first = Math.min(...withSales.map((cell) => cell.hour))
  const last = Math.max(...withSales.map((cell) => cell.hour))
  const hours = Array.from({ length: last - first + 1 }, (_, index) => first + index)
  const byPassword = new Map(cells.map((cell) => [`${String(cell.weekday)}-${String(cell.hour)}`, cell]))
  const days = [...new Set(cells.map((cell) => cell.weekday))].sort((a, b) => a - b)

  const rows = days.map((weekday) => {
    const dayCells = hours.flatMap((hour) => byPassword.get(`${String(weekday)}-${String(hour)}`) ?? [])
    return { weekday, label: dayCells[0]?.weekday_label ?? '', cells: dayCells }
  })
  return { hours, rows, max: Math.max(...withSales.map((cell) => cell.paid_orders)) }
}

/** El escalón de color de un valor: 0 es "sin pedidos", 1 a 5 la rampa de un tono. */
export function heatStep(value: number, max: number): number {
  if (value <= 0 || max <= 0) {
    return 0
  }
  return Math.min(HEAT_STEPS, Math.ceil((value / max) * HEAT_STEPS))
}

export function heatColor(step: number): string {
  return step === 0 ? 'var(--chart-empty)' : `var(--chart-seq-${String(step)})`
}
