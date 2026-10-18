/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión de restaurante en varias pestañas del mismo navegador: cada una
// carga su propio almacén (módulos nuevos) sobre el mismo `localStorage`.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { unstubAllGlobals } from '#jest/globals'
import { type TestStorage, notify, fakeStorage, readSaved, newTab, tokenThatExpires } from '#jest/tabs'

import type { StaffSession } from '@/api/types'

const STORAGE_KEY = 'resthub.session.v3'
const PREVIEW = 'resthub.vista-previa.sesion.v1'
const MARK = 'resthub.vista-previa.pestana.v1'

function account(userId: number, changes: Partial<StaffSession> = {}): StaffSession {
  return {
    user: { id: userId, role_id: 1 },
    restaurant: { id: 1, timezone: 'America/Lima' },
    permissions: [],
    ...changes,
  } as unknown as StaffSession
}

async function openTab(local: TestStorage, route = '/') {
  const { window, tab } = newTab(local, route)
  const { useSession } = await import('./session')
  const { currentAuthToken, expireSession } = await import('@/services/apiCredentials')
  return { window, tab, useSession, currentAuthToken, expireSession }
}

// Una pestaña que se abre con la sesión ya guardada y recupera su token de la cookie.
async function openRestored(local: TestStorage, token: string, owner: StaffSession) {
  const opened = await openTab(local)
  opened.useSession.getState().renew(null, token, owner)
  return opened
}

function saved(local: TestStorage) {
  return readSaved(local, STORAGE_KEY) as { tag: string; expiresAt: number; account: StaffSession; token?: string } | null
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
    const two = await openRestored(local, tokenA, account(1))
    expect(two.useSession.getState().token).toBe(tokenA)

    one.useSession.getState().signOut()
    const tokenB = tokenThatExpires(3600, 'b')
    one.useSession.getState().signIn(tokenB, account(2))
    const written = saved(local)
    two.useSession.getState().renew(tokenA, tokenThatExpires(7200, 'a2'), account(1))

    expect(saved(local)).toEqual(written)
    expect(written?.account).toEqual(account(2))
    // La pestaña vieja deja de ser A.
    expect(two.useSession.getState()).toMatchObject({ token: null, account: null })
    expect(two.currentAuthToken()).toBeNull()
    // Al recargar, el navegador sigue con B.
    const reload = await openTab(local)
    expect(reload.useSession.getState()).toMatchObject({ token: null, account: account(2) })
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
    expect(two.useSession.getState()).toMatchObject({ token: null, account: null })
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

    expect(two.useSession.getState()).toMatchObject({ token: null, account: null })
    expect(saved(local)?.account).toEqual(account(2))
  })

  it('la renovación de otra pestaña de la misma cuenta no cambia el token de esta', async () => {
    const local = fakeStorage()
    const old = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(old, account(1))
    const two = await openRestored(local, tokenThatExpires(3600, 'b'), account(1))
    const tag = saved(local)?.tag

    one.useSession.getState().renew(old, tokenThatExpires(7200, 'a2'), account(1))
    notify(two.window, local, STORAGE_KEY)

    expect(saved(local)?.tag).toBe(tag)
    expect(two.useSession.getState()).toMatchObject({ token: tokenThatExpires(3600, 'b'), account: account(1) })
  })

  it('tras cambiar la contraseña en otra pestaña, esta suelta su token cortado y sigue con la cookie', async () => {
    const local = fakeStorage()
    const old = tokenThatExpires(3600, 'a')
    const one = await openTab(local)
    one.useSession.getState().signIn(old, account(1))
    const mine = tokenThatExpires(3600, 'b')
    const two = await openRestored(local, mine, account(1))

    // La pestaña que cambia la clave renueva con el token de la respuesta.
    one.useSession.getState().renew(old, tokenThatExpires(3600, 'clave-nueva'), account(1))
    // El servidor cortó el token de la otra: su 401 no cierra la sesión del navegador.
    two.expireSession(mine)

    expect(two.useSession.getState()).toMatchObject({ token: null, account: account(1), expired: false })
    expect(two.currentAuthToken()).toBeNull()
    expect(saved(local)?.account).toEqual(account(1))
    expect(one.useSession.getState().account).toEqual(account(1))
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

    // El token lo recupera de la cookie, como al recargar.
    expect(two.useSession.getState()).toMatchObject({ token: null, account: account(1), expired: false })
  })

  it('vaciar todo el almacenamiento (key null) también cierra la sesión', async () => {
    const local = fakeStorage()
    const one = await openTab(local)
    one.useSession.getState().signIn(tokenThatExpires(3600), account(1))
    const two = await openTab(local)

    local.data.clear()
    notify(two.window, local, null)

    expect(two.useSession.getState()).toMatchObject({ token: null, account: null })
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

    expect(two.useSession.getState().account).toMatchObject(account(1))
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
