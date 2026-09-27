import { describe, expect, it } from '@jest/globals'

import { celda } from '#jest/fixtures/panel'
import { entrarComo, PERMISOS_MESERO, servidor } from '#jest/harness'
import { queryClient } from '../../services/queryClient'
import { heatColor, heatmapModel, heatStep } from './charts/heatmapModel'
import { addDays, customRangeProblem, daysBetween, isRangePreset, MAX_RANGE_DAYS, presetRange } from './dateRange'
import { prefetchInsights } from './prefetchInsights'

const HOY = '2026-09-26'
const INICIO_DE_MES = '2026-09-01'
const ENERO = '2025-01-01'

describe('rangos del panel', () => {
  it('los rangos predefinidos terminan hoy e incluyen ambos días', () => {
    expect(presetRange('hoy', HOY)).toEqual({ date_from: HOY, date_to: HOY })
    expect(presetRange('7d', HOY)).toEqual({ date_from: '2026-09-20', date_to: HOY })
    expect(presetRange('30d', '2026-03-01')).toEqual({ date_from: '2026-01-31', date_to: '2026-03-01' })
    expect(presetRange('mes', HOY)).toEqual({ date_from: INICIO_DE_MES, date_to: HOY })
  })

  it('suma días cruzando meses y años, y cuenta ambos extremos', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
    expect(daysBetween(INICIO_DE_MES, INICIO_DE_MES)).toBe(1)
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(365)
  })

  it('reconoce solo los rangos conocidos', () => {
    expect(isRangePreset('7d')).toBe(true)
    expect(isRangePreset('personalizado')).toBe(true)
    expect(isRangePreset('90d')).toBe(false)
    expect(isRangePreset(null)).toBe(false)
  })

  it('un rango personalizado necesita dos fechas en orden y hasta 366 días', () => {
    expect(customRangeProblem('', INICIO_DE_MES)).toBe('Elige las dos fechas.')
    expect(customRangeProblem('2026-09-02', INICIO_DE_MES)).toBe('La fecha de inicio tiene que ser anterior a la de fin.')
    expect(customRangeProblem(ENERO, addDays(ENERO, MAX_RANGE_DAYS))).toBe('El rango puede tener hasta 366 días.')
    expect(customRangeProblem(ENERO, addDays(ENERO, MAX_RANGE_DAYS - 1))).toBeNull()
    expect(customRangeProblem(INICIO_DE_MES, INICIO_DE_MES)).toBeNull()
  })
})

describe('mapa de calor', () => {
  it('recorta las horas sin ventas y ordena los días de lunes a domingo', () => {
    // El API manda la semana completa (7 × 24 celdas); aquí basta con una parte.
    const modelo = heatmapModel([celda(6, 12, 0), celda(6, 15, 0), celda(2, 13, 4), celda(0, 20, 2), celda(0, 9, 0), celda(2, 20, 8)])
    expect(modelo.hours).toEqual([13, 14, 15, 16, 17, 18, 19, 20])
    expect(modelo.rows.map((fila) => fila.label)).toEqual(['Lunes', 'Miércoles', 'Domingo'])
    expect(modelo.rows[1]?.cells.map((c) => c.hour)).toEqual([13, 20])
    expect(modelo.max).toBe(8)
  })

  it('sin pedidos no hay horas ni filas', () => {
    expect(heatmapModel([celda(0, 12, 0)])).toEqual({ hours: [], rows: [], max: 0 })
  })

  it('reparte los valores en cinco escalones y el cero va en gris', () => {
    expect([0, 1, 4, 5, 10, 12].map((valor) => heatStep(valor, 10))).toEqual([0, 1, 2, 3, 5, 5])
    expect(heatStep(3, 0)).toBe(0)
    expect(heatColor(0)).toBe('var(--chart-empty)')
    expect(heatColor(3)).toBe('var(--chart-seq-3)')
  })
})

describe('prefetchInsights', () => {
  it('el encargado adelanta el resumen de los últimos 30 días', async () => {
    const api = servidor().on('get', '/insights/summary', {})
    entrarComo()
    prefetchInsights()
    await queryClient.getQueryCache().findAll({ queryKey: ['insights', 'summary'] })[0]?.promise
    expect(api.llamadas('get', '/insights/summary')).toHaveLength(1)
    const { date_from: desde, date_to: hasta } = api.peticiones[0]?.params as { date_from: string; date_to: string }
    expect(daysBetween(desde, hasta)).toBe(30)
  })

  it('sin permiso del panel no pide nada', () => {
    const api = servidor()
    entrarComo(PERMISOS_MESERO)
    prefetchInsights()
    expect(api.peticiones).toHaveLength(0)
  })
})
