import { afterEach, describe, expect, it } from 'vitest'

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
    let avisos = 0
    const dejar = subscribeApiFailure(() => {
      avisos += 1
    })
    noteApiFailure('platform', 'Servicio no disponible.')
    clearApiFailure()
    expect(avisos).toBe(2)
    expect(apiFailureMessage('platform')).toBeNull()
    dejar()
  })
})
