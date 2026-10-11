/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión de restaurante en varias pestañas del mismo navegador: cada una
// carga su propio almacén (módulos nuevos) sobre el mismo `localStorage`.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { unstubAllGlobals } from '#jest/globals'
import { type AlmacenDePrueba, avisar, fakeStorage, guardado, nuevaPestana, tokenQueVence } from '#jest/pestanas'

import type { CurrentUserResponse } from '@/api/types'

const CLAVE = 'resthub.session.v2'
const PREVIA = 'resthub.vista-previa.sesion.v1'
const MARCA = 'resthub.vista-previa.pestana.v1'

function cuenta(userId: number, cambios: Partial<CurrentUserResponse> = {}): CurrentUserResponse {
  return {
    user: { id: userId, role_id: 1 },
    restaurant: { id: 1, timezone: 'America/Lima' },
    permissions: [],
    ...cambios,
  } as unknown as CurrentUserResponse
}

async function abrirPestana(local: AlmacenDePrueba, ruta = '/') {
  const { ventana, pestana } = nuevaPestana(local, ruta)
  const { useSession } = await import('./session')
  const { currentAuthToken } = await import('@/services/api')
  return { ventana, pestana, useSession, currentAuthToken }
}

function guardada(local: AlmacenDePrueba) {
  return guardado(local, CLAVE) as { token: string; account: CurrentUserResponse } | null
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
    const tokenA = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(tokenA, cuenta(1))
    const dos = await abrirPestana(local)
    expect(dos.useSession.getState().token).toBe(tokenA)

    uno.useSession.getState().signOut()
    const tokenB = tokenQueVence(3600, 'b')
    uno.useSession.getState().signIn(tokenB, cuenta(2))
    dos.useSession.getState().renew(tokenA, tokenQueVence(7200, 'a2'), cuenta(1))

    expect(guardada(local)).toEqual({ token: tokenB, account: cuenta(2) })
    // La pestaña vieja deja de ser A.
    expect(dos.useSession.getState()).toMatchObject({ token: null, account: null })
    expect(dos.currentAuthToken()).toBeNull()
    // Al recargar, el navegador sigue con B.
    const recarga = await abrirPestana(local)
    expect(recarga.useSession.getState()).toMatchObject({ token: tokenB, account: cuenta(2) })
  })

  it('una pestaña que no se enteró del cierre no lo revierte al releer la cuenta', async () => {
    const local = fakeStorage()
    const tokenA = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(tokenA, cuenta(1))
    const dos = await abrirPestana(local)

    uno.useSession.getState().signOut()
    dos.useSession.getState().refresh(cuenta(1, { permissions: ['orders.take'] }))

    expect(local.datos.has(CLAVE)).toBe(false)
    expect(dos.useSession.getState().token).toBeNull()
  })

})

describe('sesión de restaurante: aviso de otra pestaña', () => {
  it('cerrar sesión en una pestaña la cierra en las demás', async () => {
    const local = fakeStorage()
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(tokenQueVence(3600), cuenta(1))
    const dos = await abrirPestana(local)

    uno.useSession.getState().signOut()
    avisar(dos.ventana, local, CLAVE)

    expect(dos.useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
    expect(dos.currentAuthToken()).toBeNull()
  })

  it('si entra otra cuenta en otra pestaña, esta cierra la suya sin borrar la nueva', async () => {
    const local = fakeStorage()
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(tokenQueVence(3600, 'a'), cuenta(1))
    const dos = await abrirPestana(local)
    const tokenB = tokenQueVence(3600, 'b')

    // Entrar como B sin pasar por «Cerrar sesión» (otra ventana de la PWA).
    uno.useSession.getState().signIn(tokenB, cuenta(2))
    avisar(dos.ventana, local, CLAVE)

    expect(dos.useSession.getState().token).toBeNull()
    expect(guardada(local)).toEqual({ token: tokenB, account: cuenta(2) })
  })

  it('adopta el token que renovó otra pestaña de la misma cuenta', async () => {
    const local = fakeStorage()
    const viejo = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(viejo, cuenta(1))
    const dos = await abrirPestana(local)
    const nuevo = tokenQueVence(7200, 'a2')

    uno.useSession.getState().renew(viejo, nuevo, cuenta(1))
    avisar(dos.ventana, local, CLAVE)

    expect(dos.useSession.getState()).toMatchObject({ token: nuevo, account: cuenta(1) })
    expect(dos.currentAuthToken()).toBe(nuevo)
    // Si su propia renovación llega tarde, ya no es la sesión de esa respuesta.
    dos.useSession.getState().renew(viejo, tokenQueVence(7300, 'tarde'), cuenta(1))
    expect(guardada(local)?.token).toBe(nuevo)
  })

  it('tras cambiar la contraseña, la otra pestaña adopta el token nuevo y no se queda con el revocado', async () => {
    const local = fakeStorage()
    const viejo = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(viejo, cuenta(1))
    const dos = await abrirPestana(local)
    const nuevo = tokenQueVence(3600, 'clave-nueva')

    // La pestaña que cambia la clave renueva con el token de la respuesta.
    uno.useSession.getState().renew(viejo, nuevo, cuenta(1))
    expect(guardada(local)?.token).toBe(nuevo)
    avisar(dos.ventana, local, CLAVE)

    expect(dos.useSession.getState()).toMatchObject({ token: nuevo, account: cuenta(1) })
    expect(dos.currentAuthToken()).toBe(nuevo)
  })

  it('si otra pestaña ya renovó y esta no se enteró, adopta lo guardado en vez de pisarlo', async () => {
    const local = fakeStorage()
    const viejo = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(viejo, cuenta(1))
    const dos = await abrirPestana(local)
    const nuevo = tokenQueVence(7200, 'a2')

    uno.useSession.getState().renew(viejo, nuevo, cuenta(1))
    dos.useSession.getState().renew(viejo, tokenQueVence(7300, 'a3'), cuenta(1))

    expect(guardada(local)?.token).toBe(nuevo)
    expect(dos.useSession.getState()).toMatchObject({ token: nuevo, account: cuenta(1) })
  })

})

describe('sesión de restaurante: casos de borde', () => {
  it('una pestaña sin sesión adopta la que se abre en otra', async () => {
    const local = fakeStorage()
    const uno = await abrirPestana(local)
    const dos = await abrirPestana(local)
    const token = tokenQueVence(3600)

    uno.useSession.getState().signIn(token, cuenta(1))
    avisar(dos.ventana, local, CLAVE)

    expect(dos.useSession.getState()).toMatchObject({ token, account: cuenta(1), expired: false })
  })

  it('vaciar todo el almacenamiento (key null) también cierra la sesión', async () => {
    const local = fakeStorage()
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(tokenQueVence(3600), cuenta(1))
    const dos = await abrirPestana(local)

    local.datos.clear()
    avisar(dos.ventana, local, null)

    expect(dos.useSession.getState().token).toBeNull()
  })

  it('ignora los cambios de otras claves y de otro almacenamiento', async () => {
    const local = fakeStorage()
    const token = tokenQueVence(3600)
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(token, cuenta(1))
    const dos = await abrirPestana(local)

    local.datos.delete(CLAVE)
    avisar(dos.ventana, local, 'resthub.pedidos-sin-enviar.v2')
    avisar(dos.ventana, fakeStorage(), CLAVE)

    expect(dos.useSession.getState().token).toBe(token)
  })

  it('una pestaña de vista previa no se entera ni se cierra por la sesión real del navegador', async () => {
    const local = fakeStorage()
    const real = await abrirPestana(local)
    real.useSession.getState().signIn(tokenQueVence(3600, 'real'), cuenta(1))
    const previa = await abrirPestana(local, '/vista-previa')
    const tokenPrevia = tokenQueVence(1800, 'previa')
    previa.useSession.getState().startPreview(tokenPrevia, cuenta(9, { preview: true }))

    real.useSession.getState().signOut()
    avisar(previa.ventana, local, CLAVE)
    const renovado = tokenQueVence(3600, 'previa2')
    previa.useSession.getState().renew(tokenPrevia, renovado, cuenta(9, { preview: true }))

    expect(previa.useSession.getState().token).toBe(renovado)
    expect(JSON.parse(previa.pestana.datos.get(PREVIA) ?? 'null')).toMatchObject({ token: renovado })
    expect(previa.pestana.datos.get(MARCA)).toBe('1')
    expect(local.datos.has(CLAVE)).toBe(false)
  })

  it('sin almacenamiento la renovación sigue funcionando en la pestaña', async () => {
    const local = fakeStorage()
    const pestana = await abrirPestana(local)
    const viejo = tokenQueVence(3600, 'a')
    pestana.useSession.getState().signIn(viejo, cuenta(1))
    // El navegador empieza a rechazar el almacenamiento (p. ej. se llenó).
    local.getItem = () => {
      throw new Error('bloqueado')
    }
    const nuevo = tokenQueVence(7200, 'a2')

    pestana.useSession.getState().renew(viejo, nuevo, cuenta(1))

    expect(pestana.useSession.getState().token).toBe(nuevo)
  })
})
