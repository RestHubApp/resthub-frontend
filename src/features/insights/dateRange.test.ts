import { describe, expect, it } from '@jest/globals'

import { cell } from '#jest/fixtures/panel'
import { signInAs, PERMISSIONS_WAITER, server } from '#jest/harness'
import { queryClient } from '@/services/queryClient'
import { heatColor, heatmapModel, heatStep } from './charts/heatmapModel'
import { addDays, customRangeProblem, daysBetween, isRangePreset, MAX_RANGE_DAYS, presetRange } from './dateRange'
import { prefetchInsights } from './prefetchInsights'

const TODAY = '2026-09-26'
const MONTH_START = '2026-09-01'
const JANUARY = '2025-01-01'

describe('rangos del panel', () => {
  it('los rangos predefinidos terminan hoy e incluyen ambos días', () => {
    expect(presetRange('hoy', TODAY)).toEqual({ date_from: TODAY, date_to: TODAY })
    expect(presetRange('7d', TODAY)).toEqual({ date_from: '2026-09-20', date_to: TODAY })
    expect(presetRange('30d', '2026-03-01')).toEqual({ date_from: '2026-01-31', date_to: '2026-03-01' })
    expect(presetRange('mes', TODAY)).toEqual({ date_from: MONTH_START, date_to: TODAY })
  })

  it('suma días cruzando meses y años, y cuenta ambos extremos', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
    expect(daysBetween(MONTH_START, MONTH_START)).toBe(1)
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(365)
  })

  it('reconoce solo los rangos conocidos', () => {
    expect(isRangePreset('7d')).toBe(true)
    expect(isRangePreset('personalizado')).toBe(true)
    expect(isRangePreset('90d')).toBe(false)
    expect(isRangePreset(null)).toBe(false)
  })

  it('un rango personalizado necesita dos fechas en orden y hasta 366 días', () => {
    expect(customRangeProblem('', MONTH_START)).toBe('Elige las dos fechas.')
    expect(customRangeProblem('2026-09-02', MONTH_START)).toBe('La fecha de inicio tiene que ser anterior a la de fin.')
    expect(customRangeProblem(JANUARY, addDays(JANUARY, MAX_RANGE_DAYS))).toBe('El rango puede tener hasta 366 días.')
    expect(customRangeProblem(JANUARY, addDays(JANUARY, MAX_RANGE_DAYS - 1))).toBeNull()
    expect(customRangeProblem(MONTH_START, MONTH_START)).toBeNull()
  })
})

describe('mapa de calor', () => {
  it('recorta las horas sin ventas y ordena los días de lunes a domingo', () => {
    // El API manda la semana completa (7 × 24 celdas); aquí basta con una parte.
    const model = heatmapModel([cell(6, 12, 0), cell(6, 15, 0), cell(2, 13, 4), cell(0, 20, 2), cell(0, 9, 0), cell(2, 20, 8)])
    expect(model.hours).toEqual([13, 14, 15, 16, 17, 18, 19, 20])
    expect(model.rows.map((row) => row.label)).toEqual(['Lunes', 'Miércoles', 'Domingo'])
    expect(model.rows[1]?.cells.map((c) => c.hour)).toEqual([13, 20])
    expect(model.max).toBe(8)
  })

  it('sin pedidos no hay horas ni filas', () => {
    expect(heatmapModel([cell(0, 12, 0)])).toEqual({ hours: [], rows: [], max: 0 })
  })

  it('reparte los valores en cinco escalones y el cero va en gris', () => {
    expect([0, 1, 4, 5, 10, 12].map((value) => heatStep(value, 10))).toEqual([0, 1, 2, 3, 5, 5])
    expect(heatStep(3, 0)).toBe(0)
    expect(heatColor(0)).toBe('var(--chart-empty)')
    expect(heatColor(3)).toBe('var(--chart-seq-3)')
  })
})

describe('prefetchInsights', () => {
  it('el encargado adelanta el resumen de los últimos 30 días', async () => {
    const api = server().on('get', '/insights/summary', {})
    signInAs()
    prefetchInsights()
    await queryClient.getQueryCache().findAll({ queryKey: ['insights', 'summary'] })[0]?.promise
    expect(api.llamadas('get', '/insights/summary')).toHaveLength(1)
    const { date_from: from, date_to: until } = api.peticiones[0]?.params as { date_from: string; date_to: string }
    expect(daysBetween(from, until)).toBe(30)
  })

  it('sin permiso del panel no pide nada', () => {
    const api = server()
    signInAs(PERMISSIONS_WAITER)
    prefetchInsights()
    expect(api.peticiones).toHaveLength(0)
  })
})
