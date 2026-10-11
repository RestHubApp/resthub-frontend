/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import type { CurrentUserResponse } from '@/api/types'

const SECRET = 'resthub.session.v2'

function tokenThatExpires(secondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `cabecera.${btoa(JSON.stringify({ exp }))}.firma`
}

// Solo lo que el almacén lee de la cuenta.
function account(userId: number): CurrentUserResponse {
  return {
    user: { id: userId, role_id: 1 },
    restaurant: { id: 1, timezone: 'America/Lima' },
    permissions: [],
  } as unknown as CurrentUserResponse
}

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (password: string) => data.get(password) ?? null,
    setItem: (password: string, value: string) => {
      data.set(password, value)
    },
    removeItem: (password: string) => {
      data.delete(password)
    },
    data,
  }
}

// El almacén lee lo guardado al cargarse: cada prueba parte de módulos nuevos.
async function load() {
  const storage = fakeStorage()
  stubGlobal('localStorage', storage)
  jest.resetModules()
  const { useSession } = await import('./session')
  return { storage, useSession }
}

function saved(storage: ReturnType<typeof fakeStorage>): unknown {
  return JSON.parse(storage.data.get(SECRET) ?? 'null')
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  unstubAllGlobals()
})

describe('sesión normal y ciclo de vida', () => {
  it('arranca vacía y no expirada si no hay nada guardado', async () => {
    const { useSession } = await load()
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
  })

  it('restaura una sesión válida guardada', async () => {
    const storage = fakeStorage()
    const token = tokenThatExpires(3600)
    storage.data.set(SECRET, JSON.stringify({ token, account: account(1) }))
    stubGlobal('localStorage', storage)
    jest.resetModules()
    const { useSession } = await import('./session')
    expect(useSession.getState()).toMatchObject({ token, account: account(1), expired: false })
  })

  it('marca expirada y limpia storage si la sesión guardada ya venció', async () => {
    const storage = fakeStorage()
    const token = tokenThatExpires(-10)
    storage.data.set(SECRET, JSON.stringify({ token, account: account(1) }))
    stubGlobal('localStorage', storage)
    jest.resetModules()
    const { useSession } = await import('./session')
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: true })
    expect(storage.data.has(SECRET)).toBe(false)
  })

  it('iniciar sesión guarda en storage y programa el vencimiento automático', async () => {
    const { storage, useSession } = await load()
    const token = tokenThatExpires(10)
    useSession.getState().signIn(token, account(1))

    expect(useSession.getState()).toMatchObject({ token, account: account(1), expired: false })
    expect(saved(storage)).toEqual({ token, account: account(1) })

    jest.advanceTimersByTime(11_000)
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: true })
    expect(storage.data.has(SECRET)).toBe(false)
  })

  it('cerrar sesión limpia la sesión y no marca expired', async () => {
    const { storage, useSession } = await load()
    const token = tokenThatExpires(3600)
    useSession.getState().signIn(token, account(1))

    useSession.getState().signOut()
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
    expect(storage.data.has(SECRET)).toBe(false)
  })

  it('refresh actualiza la cuenta en la sesión y en storage', async () => {
    const { storage, useSession } = await load()
    const token = tokenThatExpires(3600)
    useSession.getState().signIn(token, account(1))

    const updated = { ...account(1), permissions: ['orders.take'] } as unknown as CurrentUserResponse
    useSession.getState().refresh(updated)

    expect(useSession.getState().account).toEqual(updated)
    expect(saved(storage)).toEqual({ token, account: updated })
  })

  it('refresh no hace nada si no hay sesión activa', async () => {
    const { storage, useSession } = await load()
    useSession.getState().refresh(account(2))
    expect(useSession.getState().account).toBeNull()
    expect(storage.data.size).toBe(0)
  })
})

describe('renovación de la sesión del restaurante', () => {
  it('cambia el token de la sesión que pidió la renovación', async () => {
    const { storage, useSession } = await load()
    const old = tokenThatExpires(3600)
    const fresh = tokenThatExpires(7200)
    useSession.getState().signIn(old, account(1))

    useSession.getState().renew(old, fresh, account(1))

    expect(useSession.getState().token).toBe(fresh)
    expect(saved(storage)).toEqual({ token: fresh, account: account(1) })
  })

  it('descarta la respuesta si mientras viajaba entró otra cuenta', async () => {
    const { storage, useSession } = await load()
    const old = tokenThatExpires(3600)
    const other = tokenThatExpires(3500)
    useSession.getState().signIn(old, account(1))
    useSession.getState().signOut()
    useSession.getState().signIn(other, account(2))

    useSession.getState().renew(old, tokenThatExpires(7200), account(1))

    expect(useSession.getState()).toMatchObject({ token: other, account: account(2) })
    expect(saved(storage)).toEqual({ token: other, account: account(2) })
  })

  it('no revive una sesión que se cerró mientras viajaba', async () => {
    const { storage, useSession } = await load()
    const old = tokenThatExpires(3600)
    useSession.getState().signIn(old, account(1))
    useSession.getState().signOut()

    useSession.getState().renew(old, tokenThatExpires(7200), account(1))

    expect(useSession.getState().token).toBeNull()
    expect(storage.data.has(SECRET)).toBe(false)
  })
})

const MARK = 'resthub.vista-previa.pestana.v1'
const PREVIEW = 'resthub.vista-previa.sesion.v1'
const QUEUE = 'resthub.pedidos-sin-enviar.v2'

function sampleAccount(): CurrentUserResponse {
  return { ...account(9), preview: true }
}

// Una pestaña recién abierta en `/vista-previa`, con una sesión real en localStorage.
async function previewTab(route = '/vista-previa', initial: Record<string, string> = {}) {
  const local = fakeStorage()
  local.data.set(SECRET, JSON.stringify({ token: tokenThatExpires(3600), account: account(1) }))
  const tab = fakeStorage()
  for (const [password, value] of Object.entries(initial)) {
    tab.data.set(password, value)
  }
  stubGlobal('localStorage', local)
  stubGlobal('sessionStorage', tab)
  stubGlobal('location', { pathname: route })
  jest.resetModules()
  const { useSession } = await import('./session')
  return { local, tab, useSession }
}

describe('sesión de vista previa', () => {
  it('no lee la sesión real del navegador', async () => {
    const { useSession } = await previewTab()
    expect(useSession.getState().token).toBeNull()
  })

  it('se guarda en la pestaña y deja intacta la sesión real', async () => {
    const { local, tab, useSession } = await previewTab()
    const real = local.data.get(SECRET)
    const token = tokenThatExpires(1800)

    useSession.getState().startPreview(token, sampleAccount())

    expect(local.data.get(SECRET)).toBe(real)
    expect(JSON.parse(tab.data.get(PREVIEW) ?? 'null')).toEqual({ token, account: sampleAccount() })
    expect(tab.data.get(MARK)).toBe('1')
  })

  it('rechaza una sesión que el servidor no marcó como vista previa', async () => {
    const { useSession } = await previewTab()
    expect(() => {
      useSession.getState().startPreview(tokenThatExpires(1800), { ...account(9), preview: false })
    }).toThrow()
    expect(useSession.getState().token).toBeNull()
  })

  it('en una pestaña normal no se abre', async () => {
    const { storage, useSession } = await load()
    expect(() => {
      useSession.getState().startPreview(tokenThatExpires(1800), sampleAccount())
    }).toThrow()
    expect(storage.data.size).toBe(0)
  })

  it('al recargar la pestaña vuelve la vista previa, no la sesión real', async () => {
    const token = tokenThatExpires(1800)
    const { useSession } = await previewTab('/pedidos', {
      [MARK]: '1',
      [PREVIEW]: JSON.stringify({ token, account: sampleAccount() }),
    })
    expect(useSession.getState().token).toBe(token)
  })

  it('al vencer se borra su sesión pero la pestaña sigue siendo de vista previa', async () => {
    const { local, tab, useSession } = await previewTab()
    const real = local.data.get(SECRET)
    useSession.getState().startPreview(tokenThatExpires(1800), sampleAccount())

    useSession.getState().expire()

    expect(tab.data.has(PREVIEW)).toBe(false)
    expect(tab.data.get(MARK)).toBe('1')
    expect(local.data.get(SECRET)).toBe(real)
  })

  it('salir borra la sesión y la marca, y no toca localStorage', async () => {
    const { local, tab, useSession } = await previewTab()
    const real = local.data.get(SECRET)
    useSession.getState().startPreview(tokenThatExpires(1800), sampleAccount())

    useSession.getState().exitPreview()

    expect(tab.data.size).toBe(0)
    expect(local.data.get(SECRET)).toBe(real)
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
  })

  it('salir de la vista previa en una pestaña normal no cierra la sesión', async () => {
    const { storage, useSession } = await load()
    const token = tokenThatExpires(3600)
    useSession.getState().signIn(token, account(1))

    useSession.getState().exitPreview()

    expect(useSession.getState().token).toBe(token)
    expect(saved(storage)).toEqual({ token, account: account(1) })
  })
})

describe('cola de la vista previa', () => {
  it('al vencer o salir se descarta la cola entera de la pestaña', async () => {
    for (const close of ['expire', 'exitPreview'] as const) {
      const { local, tab, useSession } = await previewTab()
      local.data.set(QUEUE, JSON.stringify([{ userId: 1, restaurantId: 1 }]))
      const real = local.data.get(QUEUE)
      useSession.getState().startPreview(tokenThatExpires(1800), sampleAccount())
      // Pedidos de dos cuentas del local de muestra, como tras entrar como encargado y luego como mesero.
      tab.data.set(QUEUE, JSON.stringify([{ userId: 9, restaurantId: 1 }, { userId: 10, restaurantId: 1 }]))

      useSession.getState()[close]()

      expect(tab.data.has(QUEUE)).toBe(false)
      expect(local.data.get(QUEUE)).toBe(real)
    }
  })

  it('al recargarse ya vencida tampoco guarda su cola', async () => {
    const { tab } = await previewTab('/pedidos', {
      [MARK]: '1',
      [PREVIEW]: JSON.stringify({ token: tokenThatExpires(-10), account: sampleAccount() }),
      [QUEUE]: JSON.stringify([{ userId: 9, restaurantId: 1 }]),
    })
    expect(tab.data.has(QUEUE)).toBe(false)
  })

  it('en una pestaña normal cerrar o vencer la sesión no toca la cola', async () => {
    const { storage, useSession } = await load()
    const queue = JSON.stringify([{ userId: 1, restaurantId: 1 }])
    storage.data.set(QUEUE, queue)
    useSession.getState().signIn(tokenThatExpires(3600), account(1))

    useSession.getState().expire()

    expect(storage.data.get(QUEUE)).toBe(queue)
  })
})
