import { describe, expect, it } from '@jest/globals'

import { mutationErrorText } from './mutationErrorText'

describe('mutationErrorText', () => {
  it('es null si la mutación no falló', () => {
    expect(mutationErrorText({ isError: false, error: null }, 'Falló.')).toBeNull()
  })

  it('usa el texto de respaldo cuando el error no trae uno del servidor', () => {
    expect(mutationErrorText({ isError: true, error: new Error('x') }, 'Falló.')).toBe('Falló.')
  })
})
