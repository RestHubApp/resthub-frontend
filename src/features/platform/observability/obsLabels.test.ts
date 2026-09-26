import { describe, expect, it } from 'vitest'

import {
  bucketAxisLabel,
  bucketTitle,
  formatBucket,
  formatErrorRate,
  prettyFields,
  statusLabel,
  toSeries,
} from './obsLabels'

const LIMA = 'America/Lima'
const INICIO = '2026-09-25T19:00:00Z'

describe('rótulos de los cubos', () => {
  it('con cubos de minutos el eje dice solo la hora', () => {
    expect(bucketAxisLabel(INICIO, 60, LIMA)).toBe('14:00')
    expect(bucketAxisLabel(INICIO, 15 * 60, LIMA)).toBe('14:00')
  })

  it('con cubos de horas (7 días) el eje dice también el día', () => {
    expect(bucketAxisLabel(INICIO, 2 * 3600, LIMA)).toBe('25 set., 14:00')
  })

  it('la lectura dice dónde empieza y dónde termina el cubo', () => {
    expect(bucketTitle(INICIO, 15 * 60, LIMA)).toBe('25 set., 14:00 – 14:15')
    expect(bucketTitle(INICIO, 2 * 3600, LIMA)).toBe('25 set., 14:00 – 16:00')
  })
})

describe('formatErrorRate', () => {
  it('la fracción del servidor se lee como porcentaje', () => {
    expect(formatErrorRate(0.0123)).toBe('1.2 %')
    expect(formatErrorRate(0)).toBe('0.0 %')
  })
})

describe('statusLabel', () => {
  it('dice la clase de cada estado', () => {
    expect(statusLabel(200)).toBe('200 · correcta')
    expect(statusLabel(404)).toBe('404 · error del cliente')
    expect(statusLabel(503)).toBe('503 · error del servidor')
    expect(statusLabel(99)).toBe('99 · otra')
  })
})

describe('prettyFields', () => {
  it('con sangría y como texto; sin campos, nada', () => {
    expect(prettyFields({})).toBeNull()
    expect(prettyFields({ a: 1, b: '<b>' })).toBe('{\n  "a": 1,\n  "b": "<b>"\n}')
  })
})

describe('formatBucket y toSeries', () => {
  it('el ancho del cubo en minutos u horas', () => {
    expect(formatBucket(60)).toBe('1 min')
    expect(formatBucket(15 * 60)).toBe('15 min')
    expect(formatBucket(2 * 3600)).toBe('2 h')
  })

  it('un punto por cubo con la medida elegida', () => {
    const puntos = [{ t: INICIO, requests: 8, errors_5xx: 1, p95_ms: 120 }]
    expect(toSeries(puntos, 60, LIMA, (p) => p.p95_ms)).toEqual([{ key: INICIO, axisLabel: '14:00', value: 120 }])
  })
})
