import { describe, expect, it } from '@jest/globals'

import { order } from '#jest/fixtures/orders'
import { COLUMNS, countByType } from './boardColumns'

describe('boardColumns', () => {
  it('el tablero tiene una columna por estado, del abierto al servido', () => {
    expect(COLUMNS).toEqual(['open', 'in_kitchen', 'ready', 'served'])
  })

  it('cuenta el total y los pedidos de cada tipo', () => {
    const counts = countByType([
      order({ id: 1, type: 'dine_in' }),
      order({ id: 2, type: 'dine_in' }),
      order({ id: 3, type: 'takeaway' }),
    ])

    expect(counts).toEqual({ all: 3, dine_in: 2, takeaway: 1, delivery: 0 })
  })
})
