import { describe, expect, it } from 'vitest'

import { formatCountdown, wallClockIn, zonedInstant } from './format'

describe('zonedInstant', () => {
  it('las 20:00 de Lima son la 01:00 UTC del día siguiente', () => {
    expect(zonedInstant('2026-09-25', '20:00', 'America/Lima')).toBe('2026-09-26T01:00:00.000Z')
  })

  it('ida y vuelta con el reloj del local', () => {
    const instante = zonedInstant('2026-03-08', '13:30', 'America/New_York')
    expect(wallClockIn(instante, 'America/New_York')).toEqual({ day: '2026-03-08', time: '13:30' })
  })
})

describe('formatCountdown', () => {
  it('minutos y segundos, como un reloj', () => {
    expect(formatCountdown(30 * 60_000)).toBe('30:00')
    expect(formatCountdown(29 * 60_000 + 59_000)).toBe('29:59')
    expect(formatCountdown(5_000)).toBe('0:05')
  })

  it('redondea hacia arriba: mientras falte algo no marca cero', () => {
    expect(formatCountdown(200)).toBe('0:01')
    expect(formatCountdown(59_001)).toBe('1:00')
  })

  it('pasada la hora agrega las horas', () => {
    expect(formatCountdown(62 * 60_000 + 3_000)).toBe('1:02:03')
  })

  it('vencido marca cero', () => {
    expect(formatCountdown(0)).toBe('0:00')
    expect(formatCountdown(-5_000)).toBe('0:00')
  })
})
