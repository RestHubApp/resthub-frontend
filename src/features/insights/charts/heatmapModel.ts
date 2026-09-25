import type { HourlyCell } from '../../../api/types'

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
  const conVentas = cells.filter((cell) => cell.paid_orders > 0)
  if (conVentas.length === 0) {
    return { hours: [], rows: [], max: 0 }
  }
  const primera = Math.min(...conVentas.map((cell) => cell.hour))
  const ultima = Math.max(...conVentas.map((cell) => cell.hour))
  const hours = Array.from({ length: ultima - primera + 1 }, (_, indice) => primera + indice)
  const porClave = new Map(cells.map((cell) => [`${String(cell.weekday)}-${String(cell.hour)}`, cell]))
  const dias = [...new Set(cells.map((cell) => cell.weekday))].sort((a, b) => a - b)

  const rows = dias.map((weekday) => {
    const celdas = hours.flatMap((hour) => porClave.get(`${String(weekday)}-${String(hour)}`) ?? [])
    return { weekday, label: celdas[0]?.weekday_label ?? '', cells: celdas }
  })
  return { hours, rows, max: Math.max(...conVentas.map((cell) => cell.paid_orders)) }
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
