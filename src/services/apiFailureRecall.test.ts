import { afterEach, describe, expect, it } from '@jest/globals'

import { answerAll } from '#jest/answerAll'
import { readRestaurant, writeRestaurant } from '#jest/apiCalls'
import { apiFailureMessage, clearApiFailure } from './apiFailure'

const CUTOFF = 'Servicio no disponible.'

function respondWith(status: number, body: unknown): void {
  answerAll(status, body)
}

afterEach(() => {
  clearApiFailure()
})

describe('el corte que recuerda el armazón', () => {
  it('una lectura caída se recuerda y se olvida cuando otra lectura responde', async () => {
    respondWith(503, { detail: CUTOFF, code: 'database_unavailable' })
    await expect(readRestaurant()).rejects.toThrow()
    expect(apiFailureMessage()).toBe(CUTOFF)

    respondWith(200, [])
    await readRestaurant()
    expect(apiFailureMessage()).toBeNull()
  })

  it('una escritura caída no queda en el armazón: la avisa su formulario', async () => {
    respondWith(503, { detail: CUTOFF, code: 'database_unavailable' })
    await expect(writeRestaurant()).rejects.toThrow()
    expect(apiFailureMessage()).toBeNull()
  })
})
