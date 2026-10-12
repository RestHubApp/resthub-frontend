import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'

import { useTokenRenewal } from './useTokenRenewal'

const MINUTE = 60_000
const NOW = new Date('2026-09-26T15:00:00Z').getTime()

// Un JWT sin firma válida: solo importa el vencimiento (`exp`, en segundos).
function tokenThatExpiresIn(ms: number): string {
  const load = btoa(JSON.stringify({ exp: (NOW + ms) / 1000 }))
  return `cabecera.${load}.firma`
}

function renewWith(token: string | null, renew = jest.fn<(origin: string) => Promise<void>>(() => Promise.resolve())) {
  renderHook(() => {
    useTokenRenewal(token, renew)
  })
  // Alguien tocó la pantalla recién (la actividad la escucha el hook ya montado).
  window.dispatchEvent(new Event('pointerdown'))
  return renew
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useTokenRenewal', () => {
  it('renueva cinco minutos antes del vencimiento, con el token que se renueva', async () => {
    const token = tokenThatExpiresIn(20 * MINUTE)
    const renew = renewWith(token)

    await jest.advanceTimersByTimeAsync(15 * MINUTE - 1)
    expect(renew).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(renew).toHaveBeenCalledWith(token)
  })

  it('un token a punto de vencer se renueva de inmediato', async () => {
    const renew = renewWith(tokenThatExpiresIn(2 * MINUTE))
    await jest.advanceTimersByTimeAsync(0)
    expect(renew).toHaveBeenCalledTimes(1)
  })

  it('una pantalla sin uso hace más de media hora no renueva', async () => {
    const renew = renewWith(tokenThatExpiresIn(60 * MINUTE))
    await jest.advanceTimersByTimeAsync(55 * MINUTE)
    expect(renew).not.toHaveBeenCalled()
  })

  it('sin token, o con uno sin vencimiento legible, no programa nada', async () => {
    const withoutToken = renewWith(null)
    const unreadable = renewWith('no-es-un-jwt')
    await jest.advanceTimersByTimeAsync(24 * 60 * MINUTE)
    expect(withoutToken).not.toHaveBeenCalled()
    expect(unreadable).not.toHaveBeenCalled()
  })

  it('si la renovación falla, la sesión sigue sin romper la pantalla', async () => {
    const failure = jest.fn<(origin: string) => Promise<void>>(() => Promise.reject(new Error('sin red')))
    renewWith(tokenThatExpiresIn(MINUTE), failure)
    await expect(jest.advanceTimersByTimeAsync(0)).resolves.toBeUndefined()
    expect(failure).toHaveBeenCalledTimes(1)
  })
})
