import { describe, expect, it } from '@jest/globals'

import { elapsedLevel, TONE_BY_LEVEL } from './elapsedTone'

describe('elapsedLevel', () => {
  it('un pedido que no se vigila siempre es normal, por mucho que lleve', () => {
    expect(elapsedLevel(false, 90)).toBe('normal')
  })

  it.each([
    [0, 'normal'],
    [14, 'normal'],
    [15, 'alert'],
    [24, 'alert'],
    [25, 'late'],
    [60, 'late'],
  ] as const)('con %i minutos en cocina es %s', (minutes, level) => {
    expect(elapsedLevel(true, minutes)).toBe(level)
  })

  it('cada nivel tiene su color', () => {
    expect(TONE_BY_LEVEL.late).toContain('destructive')
    expect(TONE_BY_LEVEL.alert).toContain('warning')
  })
})
