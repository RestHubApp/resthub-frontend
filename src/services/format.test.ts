import { describe, expect, it } from 'vitest'

import {
  formatClock,
  formatCountdown,
  formatMilliseconds,
  formatShortDateTime,
  formatTimestamp,
  wallClockIn,
  zonedInstant,
} from './format'

const LIMA = 'America/Lima'

describe('zonedInstant', () => {
  it('las 20:00 de Lima son la 01:00 UTC del día siguiente', () => {
    expect(zonedInstant('2026-09-25', '20:00', LIMA)).toBe('2026-09-26T01:00:00.000Z')
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

describe('formatMilliseconds', () => {
  it('un decimal por debajo de 10 ms, entero hasta el segundo y segundos después', () => {
    expect(formatMilliseconds(0)).toBe('0 ms')
    expect(formatMilliseconds(0.84)).toBe('0.8 ms')
    expect(formatMilliseconds(3)).toBe('3 ms')
    expect(formatMilliseconds(85.4)).toBe('85 ms')
    expect(formatMilliseconds(1250)).toBe('1.25 s')
    expect(formatMilliseconds(2000)).toBe('2 s')
  })

  it('lo que no es número es un guion', () => {
    expect(formatMilliseconds(Number.NaN)).toBe('—')
  })
})

describe('formatClock y formatShortDateTime', () => {
  it('la hora de 24 h en la zona pedida, no en la del navegador', () => {
    expect(formatClock('2026-09-25T19:05:00Z', LIMA)).toBe('14:05')
    expect(formatShortDateTime('2026-09-26T02:30:00Z', LIMA)).toBe('25 set., 21:30')
    expect(formatTimestamp('2026-09-26T02:30:09.5Z', LIMA)).toBe('25 set., 21:30:09')
  })
})
