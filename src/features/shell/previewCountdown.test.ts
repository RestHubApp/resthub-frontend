import { describe, expect, it } from '@jest/globals'

import { previewTimeLeft } from './previewCountdown'

const NOW = 1_790_000_000_000

describe('previewTimeLeft', () => {
  it('dice cuánto falta como un reloj', () => {
    expect(previewTimeLeft(NOW + 30 * 60_000, NOW)).toEqual({ label: 'Vence en 30:00', soon: false })
  })

  it('resalta los últimos cinco minutos', () => {
    expect(previewTimeLeft(NOW + 5 * 60_000, NOW)).toEqual({ label: 'Vence en 5:00', soon: true })
    expect(previewTimeLeft(NOW + 5 * 60_000 + 1_000, NOW)?.soon).toBe(false)
  })

  it('vencida lo dice', () => {
    expect(previewTimeLeft(NOW, NOW)).toEqual({ label: 'Venció', soon: true })
    expect(previewTimeLeft(NOW - 1_000, NOW)?.label).toBe('Venció')
  })

  it('sin fecha de vencimiento no dice nada', () => {
    expect(previewTimeLeft(null, NOW)).toBeNull()
  })
})
