import type { HourlyCell } from '@/api/types'
import { useChartCursor } from '@/components/charts/useChartCursor'
import type { HeatmapModel } from './heatmapModel'

/**
 * El cursor de teclado del mapa de calor.
 *
 * Traduce el índice señalado a fila, columna y celda, para anunciarla por
 * `aria-activedescendant` y ubicar su globo de lectura.
 */
export function useHeatmapCursor(model: HeatmapModel) {
  const columns = model.hours.length
  const cursor = useChartCursor(model.rows.length * columns, columns)
  const index = cursor.active
  const row = index === null ? 0 : Math.floor(index / columns)
  const column = index === null ? 0 : index % columns
  const active: HourlyCell | undefined = index === null ? undefined : model.rows[row]?.cells[column]

  return { cursor, columns, row, column, active }
}
