import { afterEach, describe, expect, it } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { buildAccount, ErrorResponse, PERMISSIONS_WAITER, server, withoutNetwork } from '#jest/harness'
import { currentAuthToken, setAuthToken, setCookieSession } from '@/services/apiCredentials'
import { queryClient } from '@/services/queryClient'
import { useSession } from '@/store/session'
import { useSessionRenewal } from './useSessionRenewal'

const WAITER = buildAccount(PERMISSIONS_WAITER)
const ME = '/auth/me'
const REFRESH = '/auth/refresh'
const RESTORED = 'token-recuperado'

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

// Como queda la pestaña al recargar: la cuenta guardada, sin token en memoria.
function reloaded(): void {
  setAuthToken(null)
  setCookieSession(true)
  useSession.setState({ token: null, account: WAITER, expired: false, passwordChanged: false })
}

afterEach(() => {
  useSession.getState().signOut()
})

describe('recuperar la sesión de la cookie', () => {
  it('lee el valor anti-CSRF, renueva con él y deja el token en memoria', async () => {
    const api = server()
    api.on('get', ME, { ...WAITER, csrf_token: 'valor-cookie' })
    api.on('post', REFRESH, { ...WAITER, access_token: RESTORED, token_type: 'bearer', expires_in: 3600, csrf_token: 'valor-2' })
    reloaded()

    renderHook(() => { useSessionRenewal() }, { wrapper })

    await waitFor(() => { expect(useSession.getState().token).toBe(RESTORED) })
    expect(currentAuthToken()).toBe(RESTORED)
    expect(api.calls('post', REFRESH)[0]?.headers['x-csrf-token']).toBe('valor-cookie')
  })

  it('sin cookie (el navegador la bloquea o venció), el 401 cierra la sesión', async () => {
    const api = server()
    api.on('get', ME, new ErrorResponse(401, 'Inicia sesión.', 'unauthenticated'))
    reloaded()

    renderHook(() => { useSessionRenewal() }, { wrapper })

    await waitFor(() => { expect(useSession.getState()).toMatchObject({ account: null, expired: true }) })
    expect(api.calls('post', REFRESH)).toHaveLength(0)
  })

  it('sin red no cierra la sesión: la cuenta sigue y se vuelve a intentar', async () => {
    const api = server()
    api.on('get', ME, withoutNetwork)
    reloaded()

    renderHook(() => { useSessionRenewal() }, { wrapper })

    await waitFor(() => { expect(api.calls('get', ME).length).toBeGreaterThan(0) })
    expect(useSession.getState()).toMatchObject({ token: null, account: WAITER, expired: false })
  })
})
