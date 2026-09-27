import { afterEach, describe, expect, it, jest } from '@jest/globals'

import {
  formatDateTime,
  formatHourOfDay,
  formatLongDate,
  formatMinutes,
  formatShortDate,
  formatShortDateTime,
  formatTime,
  formatTimestamp,
  minutesSince,
  todayIn,
} from './format'

const LIMA = 'America/Lima'
// 26/09/2026 a las 02:30 en UTC: en Lima todavía es el 25 a las 21:30.
const CASI_MEDIANOCHE = '2026-09-26T02:30:00Z'

afterEach(() => {
  jest.useRealTimers()
})

describe('fechas en la zona del restaurante', () => {
  it('«hoy» es el día del local, no el del navegador ni el de UTC', () => {
    jest.useFakeTimers({ now: new Date(CASI_MEDIANOCHE) })
    expect(todayIn(LIMA)).toBe('2026-09-25')
    expect(todayIn('UTC')).toBe('2026-09-26')
  })

  it('la hora y la fecha de un instante se escriben en la zona pedida', () => {
    expect(formatTime(CASI_MEDIANOCHE, LIMA)).toMatch(/^9:30\sp\.\s?m\.$/u)
    expect(formatDateTime(CASI_MEDIANOCHE, LIMA)).toContain('25')
    expect(formatDateTime(CASI_MEDIANOCHE, LIMA)).toContain('2026')
  })

  it('un día del local no se corre al día anterior y se escribe como en el Perú («setiembre»)', () => {
    expect(formatShortDate('2026-09-18')).toBe('18 set.')
    expect(formatLongDate('2026-09-18')).toBe('viernes, 18 de setiembre de 2026')
  })

  it('día corto con hora de 24 h, y con segundos para ordenar', () => {
    expect(formatShortDateTime('2026-09-25T19:05:09Z', LIMA)).toBe('25 set., 14:05')
    expect(formatTimestamp('2026-09-25T19:05:09Z', LIMA)).toBe('25 set., 14:05:09')
  })

  it('las horas del mapa de calor van con dos dígitos', () => {
    expect(formatHourOfDay(9)).toBe('09:00')
    expect(formatHourOfDay(13)).toBe('13:00')
  })
})

describe('tiempo transcurrido', () => {
  it('cuenta minutos enteros y nunca negativos', () => {
    const ahora = new Date('2026-09-25T20:10:30Z').getTime()
    expect(minutesSince('2026-09-25T20:00:00Z', ahora)).toBe(10)
    expect(minutesSince('2026-09-25T20:15:00Z', ahora)).toBe(0)
  })

  it('pasada la hora escribe horas y minutos con dos dígitos', () => {
    expect(formatMinutes(3)).toBe('3 min')
    expect(formatMinutes(65)).toBe('1 h 05 min')
    expect(formatMinutes(120)).toBe('2 h 00 min')
  })
})
