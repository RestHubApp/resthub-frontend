import { describe, expect, it } from 'vitest'

import { wallClockIn, zonedInstant } from './format'

describe('zonedInstant', () => {
  it('las 20:00 de Lima son la 01:00 UTC del día siguiente', () => {
    expect(zonedInstant('2026-09-25', '20:00', 'America/Lima')).toBe('2026-09-26T01:00:00.000Z')
  })

  it('ida y vuelta con el reloj del local', () => {
    const instante = zonedInstant('2026-03-08', '13:30', 'America/New_York')
    expect(wallClockIn(instante, 'America/New_York')).toEqual({ day: '2026-03-08', time: '13:30' })
  })
})
