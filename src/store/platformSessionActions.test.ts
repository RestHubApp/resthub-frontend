import { afterEach, describe, expect, it } from '@jest/globals'

import { tokenFor } from '@/services/apiRouting'
import { PLATFORM_STORAGE_KEY, usePlatformSession } from './platformSession'

const ADMIN = { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' }

function saved(): unknown {
  const text = localStorage.getItem(PLATFORM_STORAGE_KEY)
  return text === null ? null : JSON.parse(text)
}

afterEach(() => {
  usePlatformSession.getState().signOut()
})

describe('sesión del administrador del sistema', () => {
  it('refrescar actualiza los datos guardados solo con una sesión abierta', () => {
    usePlatformSession.getState().refresh(ADMIN)
    expect(usePlatformSession.getState().admin).toBeNull()

    usePlatformSession.getState().signIn('p-1', ADMIN)
    usePlatformSession.getState().refresh({ ...ADMIN, full_name: 'Soporte' })
    expect(usePlatformSession.getState().admin?.full_name).toBe('Soporte')
    expect(saved()).toEqual({ token: 'p-1', admin: { ...ADMIN, full_name: 'Soporte' } })
  })

  it('renovar cambia el token solo si la sesión sigue siendo la que pidió la renovación', () => {
    usePlatformSession.getState().signIn('p-1', ADMIN)
    usePlatformSession.getState().renew('otro', 'p-2', ADMIN)
    expect(usePlatformSession.getState().token).toBe('p-1')

    usePlatformSession.getState().renew('p-1', 'p-2', ADMIN)
    expect(usePlatformSession.getState().token).toBe('p-2')
    expect(tokenFor('/platform/restaurants', { restaurant: null, platform: 'p-2' })).toBe('p-2')
  })

  it('vencer sin sesión no marca nada; con sesión la cierra como vencida', () => {
    usePlatformSession.getState().expire()
    expect(usePlatformSession.getState().expired).toBe(false)

    usePlatformSession.getState().signIn('p-1', ADMIN)
    usePlatformSession.getState().expire()
    expect(usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: true })
    expect(saved()).toBeNull()
  })
})
