import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'

import { useTokenRenewal } from './useTokenRenewal'

const MINUTO = 60_000
const AHORA = new Date('2026-09-26T15:00:00Z').getTime()

// Un JWT sin firma válida: solo importa el vencimiento (`exp`, en segundos).
function tokenQueVenceEn(ms: number): string {
  const carga = btoa(JSON.stringify({ exp: (AHORA + ms) / 1000 }))
  return `cabecera.${carga}.firma`
}

function renovarCon(token: string | null, renovar = jest.fn<(origen: string) => Promise<void>>(() => Promise.resolve())) {
  renderHook(() => {
    useTokenRenewal(token, renovar)
  })
  // Alguien tocó la pantalla recién (la actividad la escucha el hook ya montado).
  window.dispatchEvent(new Event('pointerdown'))
  return renovar
}

beforeEach(() => {
  jest.useFakeTimers({ now: AHORA })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useTokenRenewal', () => {
  it('renueva cinco minutos antes del vencimiento, con el token que se renueva', async () => {
    const token = tokenQueVenceEn(20 * MINUTO)
    const renovar = renovarCon(token)

    await jest.advanceTimersByTimeAsync(15 * MINUTO - 1)
    expect(renovar).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(renovar).toHaveBeenCalledWith(token)
  })

  it('un token a punto de vencer se renueva de inmediato', async () => {
    const renovar = renovarCon(tokenQueVenceEn(2 * MINUTO))
    await jest.advanceTimersByTimeAsync(0)
    expect(renovar).toHaveBeenCalledTimes(1)
  })

  it('una pantalla sin uso hace más de media hora no renueva', async () => {
    const renovar = renovarCon(tokenQueVenceEn(60 * MINUTO))
    await jest.advanceTimersByTimeAsync(55 * MINUTO)
    expect(renovar).not.toHaveBeenCalled()
  })

  it('sin token, o con uno sin vencimiento legible, no programa nada', async () => {
    const sinToken = renovarCon(null)
    const ilegible = renovarCon('no-es-un-jwt')
    await jest.advanceTimersByTimeAsync(24 * 60 * MINUTO)
    expect(sinToken).not.toHaveBeenCalled()
    expect(ilegible).not.toHaveBeenCalled()
  })

  it('si la renovación falla, la sesión sigue sin romper la pantalla', async () => {
    const falla = jest.fn<(origen: string) => Promise<void>>(() => Promise.reject(new Error('sin red')))
    renovarCon(tokenQueVenceEn(MINUTO), falla)
    await expect(jest.advanceTimersByTimeAsync(0)).resolves.toBeUndefined()
    expect(falla).toHaveBeenCalledTimes(1)
  })
})
