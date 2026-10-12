import { describe, expect, it } from '@jest/globals'

import { minusState } from './stepperState'

describe('minusState', () => {
  it('con la cantidad en 1 y pudiendo quitar, "menos" quita el plato', () => {
    expect(minusState(1, true, false)).toEqual({ shouldRemoveDish: true, isDisabled: false })
  })

  it('con la cantidad en 1 y sin poder quitar, "menos" se bloquea', () => {
    expect(minusState(1, false, false)).toEqual({ shouldRemoveDish: false, isDisabled: true })
  })

  it('con mas de una porcion solo resta', () => {
    expect(minusState(3, true, false)).toEqual({ shouldRemoveDish: false, isDisabled: false })
  })

  it('deshabilitado desde afuera siempre bloquea', () => {
    expect(minusState(3, true, true).isDisabled).toBe(true)
  })
})
