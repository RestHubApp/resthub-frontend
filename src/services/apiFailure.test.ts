import { afterEach, describe, expect, it } from '@jest/globals'

import { apiFailureMessage, clearApiFailure, noteApiFailure, subscribeApiFailure } from './apiFailure'

afterEach(() => {
  clearApiFailure()
})

describe('apiFailure', () => {
  it('guarda el aviso del ámbito que falló y no el del otro', () => {
    noteApiFailure('restaurant', 'No se pudieron cargar los datos.')
    expect(apiFailureMessage('restaurant')).toBe('No se pudieron cargar los datos.')
    expect(apiFailureMessage('platform')).toBeNull()
  })

  it('avisa a quien escucha y se olvida al reintentar', () => {
    let notices = 0
    const leave = subscribeApiFailure(() => {
      notices += 1
    })
    noteApiFailure('platform', 'Servicio no disponible.')
    clearApiFailure()
    expect(notices).toBe(2)
    expect(apiFailureMessage('platform')).toBeNull()
    leave()
  })
})
