/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión de restaurante en varias pestañas del mismo navegador: cada una
// carga su propio almacén (módulos nuevos) sobre el mismo `localStorage`.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { unstubAllGlobals } from '#jest/globals'
import { type TestStorage, notify, fakeStorage, readSaved, newTab, tokenThatExpires } from '#jest/tabs'

import type { CurrentUserResponse } from '@/api/types'

const STORAGE_KEY = 'resthub.session.v2'
const PREVIEW = 'resthub.vista-previa.sesion.v1'
const MARK = 'resthub.vista-previa.pestana.v1'

function account(userId: number, changes: Partial<CurrentUserResponse> = {}): CurrentUserResponse {
  return {
    user: { id: userId, role_id: 1 },
    restaurant: { id: 1, timezone: 'America/Lima' },
    permissions: [],
    ...changes,
  } as unknown as CurrentUserResponse
}

async function openTab(local: TestStorage, route = '/') {
  const { window, tab } = newTab(local, route)
  const { useSession } = await import('./session')
  const { currentAuthToken } = await import('@/services/api')
  return { window, tab, useSession, currentAuthToken }
}

function saved(local: TestStorage) {
  return readSaved(local, STORAGE_KEY) as { token: string; account: CurrentUserResponse } | null
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  unstubAllGlobals()
})

describe('sesión de restaurante entre pestañas', () => {
  // Reproduce el hallazgo de la auditoría: la cuenta A cierra sesión en una
  // pestaña, entra B en la misma, y la otra pestaña (que no se enteró) renueva
  // el token de A. Antes, la renovación escribía la sesión de A encima de la de
  // B y la siguiente recarga dejaba a B operando como A.
  it('una pestaña que no se enteró del cierre no pisa la sesión de la otra cuenta al renovar', async () => {
    const local = fakeStorage()
    const tokenA = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(tokenA, account(1))
    const two = await openTab(local)
    expect(two.useSession.getState().token).toBe(tokenA)

    one.useSession.getState().signOut()
    const tokenB = tokenThatExpires(3600, 'b')
    one.useSession.getState().signIn(tokenB, account(2))
    two.useSession.getState().renew(tokenA, tokenThatExpires(7200, 'a2'), account(1))

    expect(saved(local)).toEqual({ token: tokenB, account: account(2) })
    // La pestaña vieja deja de ser A.
    expect(two.useSession.getState()).toMatchObject({ token: null, account: null })
    expect(two.currentAuthToken()).toBeNull()
    // Al recargar, el navegador sigue con B.
    const reload = await openTab(local)
    expect(reload.useSession.getState()).toMatchObject({ token: tokenB, account: account(2) })
  })

  it('una pestaña que no se enteró del cierre no lo revierte al releer la cuenta', async () => {
    const local = fakeStorage()
    const tokenA = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(tokenA, account(1))
    const two = await openTab(local)

    one.useSession.getState().signOut()
    two.useSession.getState().refresh(account(1, { permissions: ['orders.take'] }))

    expect(local.data.has(STORAGE_KEY)).toBe(false)
    expect(two.useSession.getState().token).toBeNull()
  })

})

describe('sesión de restaurante: aviso de otra pestaña', () => {
  it('cerrar sesión en una pestaña la cierra en las demás', async () => {
    const local = fakeStorage()
    const one = await openTab(local)
    one.useSession.getState().signIn(tokenThatExpires(3600), account(1))
    const two = await openTab(local)

    one.useSession.getState().signOut()
    notify(two.window, local, STORAGE_KEY)

    expect(two.useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
    expect(two.currentAuthToken()).toBeNull()
  })

  it('si entra otra cuenta en otra pestaña, esta cierra la suya sin borrar la nueva', async () => {
    const local = fakeStorage()
    const one = await openTab(local)
    one.useSession.getState().signIn(tokenThatExpires(3600, 'a'), account(1))
    const two = await openTab(local)
    const tokenB = tokenThatExpires(3600, 'b')

    // Entrar como B sin pasar por «Cerrar sesión» (otra ventana de la PWA).
    one.useSession.getState().signIn(tokenB, account(2))
    notify(two.window, local, STORAGE_KEY)

    expect(two.useSession.getState().token).toBeNull()
    expect(saved(local)).toEqual({ token: tokenB, account: account(2) })
  })

  it('adopta el token que renovó otra pestaña de la misma cuenta', async () => {
    const local = fakeStorage()
    const old = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(old, account(1))
    const two = await openTab(local)
    const fresh = tokenThatExpires(7200, 'a2')

    one.useSession.getState().renew(old, fresh, account(1))
    notify(two.window, local, STORAGE_KEY)

    expect(two.useSession.getState()).toMatchObject({ token: fresh, account: account(1) })
    expect(two.currentAuthToken()).toBe(fresh)
    // Si su propia renovación llega tarde, ya no es la sesión de esa respuesta.
    two.useSession.getState().renew(old, tokenThatExpires(7300, 'tarde'), account(1))
    expect(saved(local)?.token).toBe(fresh)
  })

  it('tras cambiar la contraseña, la otra pestaña adopta el token nuevo y no se queda con el revocado', async () => {
    const local = fakeStorage()
    const old = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(old, account(1))
    const two = await openTab(local)
    const fresh = tokenThatExpires(3600, 'clave-nueva')

    // La pestaña que cambia la clave renueva con el token de la respuesta.
    one.useSession.getState().renew(old, fresh, account(1))
    expect(saved(local)?.token).toBe(fresh)
    notify(two.window, local, STORAGE_KEY)

    expect(two.useSession.getState()).toMatchObject({ token: fresh, account: account(1) })
    expect(two.currentAuthToken()).toBe(fresh)
  })

  it('si otra pestaña ya renovó y esta no se enteró, adopta lo guardado en vez de pisarlo', async () => {
    const local = fakeStorage()
    const old = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(old, account(1))
    const two = await openTab(local)
    const fresh = tokenThatExpires(7200, 'a2')

    one.useSession.getState().renew(old, fresh, account(1))
    two.useSession.getState().renew(old, tokenThatExpires(7300, 'a3'), account(1))

    expect(saved(local)?.token).toBe(fresh)
    expect(two.useSession.getState()).toMatchObject({ token: fresh, account: account(1) })
  })

})

describe('sesión de restaurante: casos de borde', () => {
  it('una pestaña sin sesión adopta la que se abre en otra', async () => {
    const local = fakeStorage()
    const one = await openTab(local)
    const two = await openTab(local)
    const token = tokenThatExpires(3600)

    one.useSession.getState().signIn(token, account(1))
    notify(two.window, local, STORAGE_KEY)

    expect(two.useSession.getState()).toMatchObject({ token, account: account(1), expired: false })
  })

  it('vaciar todo el almacenamiento (key null) también cierra la sesión', async () => {
    const local = fakeStorage()
    const one = await openTab(local)
    one.useSession.getState().signIn(tokenThatExpires(3600), account(1))
    const two = await openTab(local)

    local.data.clear()
    notify(two.window, local, null)

    expect(two.useSession.getState().token).toBeNull()
  })

  it('ignora los cambios de otras claves y de otro almacenamiento', async () => {
    const local = fakeStorage()
    const token = tokenThatExpires(3600)
    const one = await openTab(local)
    one.useSession.getState().signIn(token, account(1))
    const two = await openTab(local)

    local.data.delete(STORAGE_KEY)
    notify(two.window, local, 'resthub.pedidos-sin-enviar.v2')
    notify(two.window, fakeStorage(), STORAGE_KEY)

    expect(two.useSession.getState().token).toBe(token)
  })

  it('una pestaña de vista previa no se entera ni se cierra por la sesión real del navegador', async () => {
    const local = fakeStorage()
    const real = await openTab(local)
    real.useSession.getState().signIn(tokenThatExpires(3600, 'real'), account(1))
    const preview = await openTab(local, '/vista-previa')
    const previewToken = tokenThatExpires(1800, 'previa')
    preview.useSession.getState().startPreview(previewToken, account(9, { preview: true }))

    real.useSession.getState().signOut()
    notify(preview.window, local, STORAGE_KEY)
    const renewed = tokenThatExpires(3600, 'previa2')
    preview.useSession.getState().renew(previewToken, renewed, account(9, { preview: true }))

    expect(preview.useSession.getState().token).toBe(renewed)
    expect(JSON.parse(preview.tab.data.get(PREVIEW) ?? 'null')).toMatchObject({ token: renewed })
    expect(preview.tab.data.get(MARK)).toBe('1')
    expect(local.data.has(STORAGE_KEY)).toBe(false)
  })

  it('sin almacenamiento la renovación sigue funcionando en la pestaña', async () => {
    const local = fakeStorage()
    const tab = await openTab(local)
    const old = tokenThatExpires(3600, 'a')
    tab.useSession.getState().signIn(old, account(1))
    // El navegador empieza a rechazar el almacenamiento (p. ej. se llenó).
    local.getItem = () => {
      throw new Error('bloqueado')
    }
    const fresh = tokenThatExpires(7200, 'a2')

    tab.useSession.getState().renew(old, fresh, account(1))

    expect(tab.useSession.getState().token).toBe(fresh)
  })
})
