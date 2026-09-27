import { describe, expect, it } from '@jest/globals'

import {
  centsToApi,
  formatCents,
  formatChange,
  formatConfidence,
  formatDays,
  formatInteger,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  formatQuantity,
  formatSignedQuantity,
  toCents,
  toNumber,
} from './format'

// Intl separa el símbolo del monto con un espacio que no se corta (U+00A0).
const S = 'S/\u00a0'

describe('dinero', () => {
  it('escribe soles como en el Perú y un valor que no es número como guion', () => {
    expect(formatMoney('1234.5')).toBe(`${S}1,234.50`)
    expect(formatMoney(0)).toBe(`${S}0.00`)
    expect(formatMoney('abc')).toBe('—')
  })

  it('en los ejes quita los céntimos en cero y compacta desde mil', () => {
    expect(formatMoneyCompact(850)).toBe(`${S}850`)
    expect(formatMoneyCompact(850.5)).toBe(`${S}850.50`)
    expect(formatMoneyCompact(2500)).toMatch(/^S\/\s2\.5\s?K$/u)
  })

  it('pasa a céntimos enteros sin errores de coma flotante', () => {
    expect(toCents('0.1')).toBe(10)
    expect(toCents('28.35')).toBe(2835)
    expect(toCents(19.99)).toBe(1999)
    expect(toCents('no')).toBe(0)
  })

  it('vuelve de céntimos al texto que espera el API y al que ve el usuario', () => {
    expect(centsToApi(10000)).toBe('100.00')
    expect(centsToApi(5)).toBe('0.05')
    expect(formatCents(2835)).toBe(`${S}28.35`)
  })

  it('toNumber trata nulos, vacíos y textos como cero', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber('')).toBe(0)
    expect(toNumber('12.5')).toBe(12.5)
    expect(toNumber(Number.NaN)).toBe(0)
  })
})

describe('números', () => {
  it('enteros con separador de miles', () => {
    expect(formatInteger('12345.6')).toBe('12,346')
  })

  it('porcentajes con un decimal y guion si no hay dato', () => {
    expect(formatPercent('65.64')).toBe('65.6 %')
    expect(formatPercent('x')).toBe('—')
  })

  it('una variación lleva siempre su signo', () => {
    expect(formatChange('2.5')).toBe('+2.5 %')
    expect(formatChange(-0.94)).toBe('−0.9 %')
    expect(formatChange(0)).toBe('0.0 %')
  })

  it('la confianza de la IA es un porcentaje entero, o «Sin dato»', () => {
    expect(formatConfidence(0.873)).toBe('87 %')
    expect(formatConfidence(null)).toBe('Sin dato')
  })

  it('los días van en singular solo cuando es uno', () => {
    expect(formatDays(1)).toBe('1 día')
    expect(formatDays('0.75')).toBe('0.75 días')
  })
})

describe('cantidades de insumo', () => {
  it('desde mil gramos o mililitros pasa a kg o L, con hasta tres decimales', () => {
    expect(formatQuantity('5600', 'g')).toBe('5.6 kg')
    expect(formatQuantity(1125, 'g')).toBe('1.125 kg')
    expect(formatQuantity('1500', 'ml')).toBe('1.5 L')
    expect(formatQuantity('250', 'ml')).toBe('250 ml')
  })

  it('las unidades no cambian de escala y una unidad desconocida se muestra tal cual', () => {
    expect(formatQuantity('5000', 'unit')).toBe('5,000 unid.')
    expect(formatQuantity('3', 'caja')).toBe('3 caja')
    expect(formatQuantity('x', 'g')).toBe('—')
  })

  it('el libro de movimientos muestra el signo de entradas y salidas', () => {
    expect(formatSignedQuantity('5000', 'g')).toBe('+5 kg')
    expect(formatSignedQuantity('-150', 'g')).toBe('−150 g')
  })
})
