import { afterEach, describe, expect, it } from '@jest/globals'
import { renderHook } from '@testing-library/react'

import { buildAccount, PERMISSIONS_WAITER } from '#jest/harness'
import { currentAuthToken } from '@/services/api'
import { queryClient } from '@/services/queryClient'
import { RESTAURANT_SESSION_KEY } from '@/services/tabStorage'
import {
  can,
  currentTimeZone,
  hasPermission,
  useCan,
  usePermissions,
  usePreview,
  useSession,
  useTimeZone,
} from './session'

const WAITER = buildAccount(PERMISSIONS_WAITER)
const CHARGE = 'orders.charge'
const BOGOTA = 'America/Bogota'

function saved(): unknown {
  const text = localStorage.getItem(RESTAURANT_SESSION_KEY)
  return text === null ? null : JSON.parse(text)
}

afterEach(() => {
  useSession.getState().signOut()
  localStorage.clear()
})

describe('sesión de restaurante', () => {
  it('entrar guarda el token y la cuenta, y el token viaja en cada petición', () => {
    useSession.getState().signIn('t-1', WAITER)

    expect(useSession.getState()).toMatchObject({ token: 't-1', account: WAITER, expired: false })
    expect(saved()).toEqual({ token: 't-1', account: WAITER })
    expect(currentAuthToken()).toBe('t-1')
  })

  it('cerrar por cambio de contraseña vacía la sesión y lo explica hasta la próxima entrada', () => {
    useSession.getState().signIn('t-1', WAITER)

    useSession.getState().signOutAfterPasswordChange()
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: false, passwordChanged: true })
    expect(saved()).toBeNull()

    useSession.getState().signIn('t-2', WAITER)
    expect(useSession.getState().passwordChanged).toBe(false)
  })

  it('refrescar cambia la cuenta y la guardada, pero sin sesión no hace nada', () => {
    useSession.getState().refresh(WAITER)
    expect(useSession.getState().account).toBeNull()

    useSession.getState().signIn('t-1', WAITER)
    const renamed = buildAccount(PERMISSIONS_WAITER, { preview: false, user: { ...WAITER.user, full_name: 'Ana T.' } })
    useSession.getState().refresh(renamed)
    expect(useSession.getState().account?.user.full_name).toBe('Ana T.')
    expect(saved()).toEqual({ token: 't-1', account: renamed })
  })

  it('una renovación que llega tarde, para otra sesión, se descarta', () => {
    useSession.getState().signIn('t-1', WAITER)
    useSession.getState().renew('t-viejo', 't-2', WAITER)
    expect(useSession.getState().token).toBe('t-1')

    useSession.getState().renew('t-1', 't-2', WAITER)
    expect(useSession.getState().token).toBe('t-2')
    expect(currentAuthToken()).toBe('t-2')
  })

  it('cerrar la sesión borra lo guardado y vacía el caché de esa cuenta', () => {
    useSession.getState().signIn('t-1', WAITER)
    queryClient.setQueryData(['orders'], [1, 2])
    queryClient.setQueryData(['platform', 'restaurants'], ['se queda'])

    useSession.getState().signOut()

    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
    expect(saved()).toBeNull()
    expect(currentAuthToken()).toBeNull()
    expect(queryClient.getQueryData(['orders'])).toBeUndefined()
    expect(queryClient.getQueryData(['platform', 'restaurants'])).toEqual(['se queda'])
  })

  it('vencer marca la sesión como vencida; sin sesión abierta no cambia nada', () => {
    useSession.getState().expire()
    expect(useSession.getState().expired).toBe(false)

    useSession.getState().signIn('t-1', WAITER)
    useSession.getState().expire()
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: true })
  })

  it('una sesión de vista previa no se abre en una pestaña normal', () => {
    expect(() => {
      useSession.getState().startPreview('t-p', { ...WAITER, preview: true })
    }).toThrow('Una sesion de vista previa solo se abre en su propia pestana.')
    useSession.getState().exitPreview()
    expect(useSession.getState().account).toBeNull()
  })
})

describe('permisos de la cuenta', () => {
  it('se pregunta por permisos, no por el rol', () => {
    expect(hasPermission(WAITER, CHARGE)).toBe(true)
    expect(hasPermission(WAITER, 'cash.manage')).toBe(false)
    expect(hasPermission(null, CHARGE)).toBe(false)
  })

  it('los hooks y `can` leen la sesión de este momento', () => {
    useSession.getState().signIn('t-1', WAITER)
    expect(renderHook(() => useCan(CHARGE)).result.current).toBe(true)
    expect(renderHook(() => useCan('staff.manage')).result.current).toBe(false)
    expect(renderHook(() => usePermissions()).result.current).toEqual(PERMISSIONS_WAITER)
    expect(renderHook(() => usePreview()).result.current).toBe(false)
    expect(can('tables.read')).toBe(true)
  })

  it('sin sesión no hay permisos y la zona es la de Lima', () => {
    expect(renderHook(() => usePermissions()).result.current).toEqual([])
    expect(renderHook(() => useTimeZone()).result.current).toBe('America/Lima')
    expect(currentTimeZone()).toBe('America/Lima')
  })

  it('«hoy» y las horas son las de la zona del local', () => {
    useSession.getState().signIn('t-1', buildAccount(PERMISSIONS_WAITER, { restaurant: { ...WAITER.restaurant, timezone: BOGOTA } }))
    expect(currentTimeZone()).toBe(BOGOTA)
    expect(renderHook(() => useTimeZone()).result.current).toBe(BOGOTA)
  })
})
