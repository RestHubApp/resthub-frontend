import { describe, expect, it } from 'vitest'

import { previewTimeLeft } from './previewCountdown'

const AHORA = 1_790_000_000_000

describe('previewTimeLeft', () => {
  it('dice cuánto falta como un reloj', () => {
    expect(previewTimeLeft(AHORA + 30 * 60_000, AHORA)).toEqual({ label: 'Vence en 30:00', soon: false })
  })

  it('resalta los últimos cinco minutos', () => {
    expect(previewTimeLeft(AHORA + 5 * 60_000, AHORA)).toEqual({ label: 'Vence en 5:00', soon: true })
    expect(previewTimeLeft(AHORA + 5 * 60_000 + 1_000, AHORA)?.soon).toBe(false)
  })

  it('vencida lo dice', () => {
    expect(previewTimeLeft(AHORA, AHORA)).toEqual({ label: 'Venció', soon: true })
    expect(previewTimeLeft(AHORA - 1_000, AHORA)?.label).toBe('Venció')
  })

  it('sin fecha de vencimiento no dice nada', () => {
    expect(previewTimeLeft(null, AHORA)).toBeNull()
  })
})
