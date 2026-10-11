import { afterEach, describe, expect, it } from '@jest/globals'

import { apiFailureMessage, clearApiFailure, noteApiFailure, subscribeApiFailure } from './apiFailure'

afterEach(() => {
  clearApiFailure()
})

const CUTOFF = 'No se pudieron cargar los datos.'

describe('apiFailure', () => {
  it('guarda el último aviso del corte', () => {
    noteApiFailure(CUTOFF)
    expect(apiFailureMessage()).toBe(CUTOFF)
    expect(apiFailureMessage()).toBe(CUTOFF)
  })

  it('avisa a quien escucha y se olvida al reintentar', () => {
    let notices = 0
    const leave = subscribeApiFailure(() => {
      notices += 1
    })
    noteApiFailure('Servicio no disponible.')
    clearApiFailure()
    expect(notices).toBe(2)
    expect(apiFailureMessage()).toBeNull()
    leave()
  })
})
