import type { PurchaseOrder } from '@/api/types'
import { decimalText, isLineCost, isLineQuantity } from './lineNumbers'

/** Lo que se escribió por línea al recibir: cantidad y costo real, como texto. */
export type Received = Readonly<Partial<Record<number, { quantity: string; unitCost: string }>>>

/** Una línea lista para enviar al servidor. */
export interface ReceivedLine {
  readonly line_id: number
  readonly quantity: string
  readonly unit_cost: string
}

/** Lo recibido al abrir: lo mismo que se pidió. */
export function initialReceived(order: PurchaseOrder): Received {
  return Object.fromEntries(
    order.lines.map((line) => [line.id, { quantity: line.quantity, unitCost: line.unit_cost }]),
  )
}

/** Las líneas con coma decimal cambiada a punto, tal como las espera el servidor. */
export function receivedLines(order: PurchaseOrder, values: Received): ReceivedLine[] {
  return order.lines.map((line) => ({
    line_id: line.id,
    quantity: decimalText(values[line.id]?.quantity ?? '0'),
    unit_cost: decimalText(values[line.id]?.unitCost ?? '0'),
  }))
}

/** Si todas las cantidades y costos escritos son números que acepta el servidor (3 y 6 decimales). */
export function areReceivedLinesValid(lines: readonly ReceivedLine[]): boolean {
  return lines.every((line) => isLineQuantity(line.quantity) && isLineCost(line.unit_cost))
}
