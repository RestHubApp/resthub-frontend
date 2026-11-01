import { describe, expect, it } from '@jest/globals'

import { purchaseOrder } from '#jest/fixtures/inventory'
import { areReceivedLinesValid, initialReceived, receivedLines } from './receiveLines'

describe('receiveLines', () => {
  it('arranca con lo pedido', () => {
    const order = purchaseOrder()
    const first = order.lines[0]

    expect(initialReceived(order)[first?.id ?? 0]).toEqual({ quantity: first?.quantity, unitCost: first?.unit_cost })
  })

  it('cambia la coma decimal por punto y completa con 0 lo que falta', () => {
    const order = purchaseOrder()
    const id = order.lines[0]?.id ?? 0

    const lines = receivedLines(order, { [id]: { quantity: '2,5', unitCost: '1,20' } })

    expect(lines[0]).toEqual({ line_id: id, quantity: '2.5', unit_cost: '1.20' })
    expect(receivedLines(order, {})[0]).toEqual({ line_id: id, quantity: '0', unit_cost: '0' })
  })

  it('rechaza lo que no es número', () => {
    expect(areReceivedLinesValid([{ line_id: 1, quantity: '2.5', unit_cost: '3' }])).toBe(true)
    expect(areReceivedLinesValid([{ line_id: 1, quantity: 'dos', unit_cost: '3' }])).toBe(false)
    expect(areReceivedLinesValid([{ line_id: 1, quantity: '', unit_cost: '3' }])).toBe(false)
  })

  it('rechaza más decimales de los que guarda el servidor: 3 en la cantidad y 6 en el costo', () => {
    expect(areReceivedLinesValid([{ line_id: 1, quantity: '5000.000', unit_cost: '0.004200' }])).toBe(true)
    expect(areReceivedLinesValid([{ line_id: 1, quantity: '5000', unit_cost: '0.0042001' }])).toBe(false)
    expect(areReceivedLinesValid([{ line_id: 1, quantity: '1.2345', unit_cost: '0.004' }])).toBe(false)
  })
})
