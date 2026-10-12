import type { PurchaseOrder } from '@/api/types'

/** Lo que se escribió por línea al recibir: cantidad y costo real, como texto. */
export type Received = Readonly<Partial<Record<number, { quantity: string; unitCost: string }>>>

/** Una línea lista para enviar al servidor. */
export interface ReceivedLine {
  readonly line_id: number
  readonly quantity: string
  readonly unit_cost: string
}

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const NUMBER = /^\d+(?:[.,]\d+)?$/u

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
    quantity: (values[line.id]?.quantity ?? '0').replace(',', '.'),
    unit_cost: (values[line.id]?.unitCost ?? '0').replace(',', '.'),
  }))
}

/** Si todas las cantidades y costos escritos son números. */
export function areReceivedLinesValid(lines: readonly ReceivedLine[]): boolean {
  return lines.every((line) => NUMBER.test(line.quantity) && NUMBER.test(line.unit_cost))
}
