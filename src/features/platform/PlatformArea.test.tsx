import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { ADMIN, PERMISSIONS_PLATFORM, signInToPlatform, mountPlatform } from '#jest/fixtures/platform'
import { firstOf, signInAs, ErrorResponse, server } from '#jest/harness'
import { useSession } from '@/store/session'

// Contraseña de prueba, no una credencial real.
const TEST_SECRET = 'resthub123'

const PLATFORM = '/plataforma'
const PLATFORM_RESTHUB_DEV = 'plataforma@resthub.dev'
const MENU = { name: 'Navegación principal' }

const LOGIN = '/auth/login'
const LIST = '/platform/restaurants'
const SIGN_IN = { name: 'Entrar' }
const CURRENT = 'aria-current'
const SIGN_OUT = { name: 'Cerrar sesión' }
const RESTAURANTS = 'Restaurantes'
const SYSTEM = 'Administración del sistema'
const PAGE_EMPTY = { items: [], total: 0 }

// Lo que responde `GET /auth/me` a una cuenta de plataforma.
function platformSession(changes: Record<string, unknown> = {}) {
  return { kind: 'platform', admin: ADMIN, permissions: PERMISSIONS_PLATFORM, preview: false, ...changes }
}

function platformServer() {
  return server().on('get', LIST, PAGE_EMPTY).on('get', '/auth/me', platformSession())
}

function menuOf(): HTMLElement {
  const [menu] = screen.getAllByRole('navigation', MENU)
  if (menu === undefined) {
    throw new Error('Falta el menú.')
  }
  return menu
}

describe('acceso del equipo de RestHub por el acceso de todos', () => {
  it('entra con su cuenta de plataforma y cae en Restaurantes', async () => {
    const api = platformServer()
    api.on('post', LOGIN, { access_token: 'token-plataforma', token_type: 'bearer', expires_in: 3600, ...platformSession() })
    const { user, router } = mountPlatform('/acceso')

    await user.type(await screen.findByLabelText('Correo'), PLATFORM_RESTHUB_DEV)
    await user.type(screen.getByLabelText('Contraseña'), TEST_SECRET)
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByRole('heading', { name: RESTAURANTS, level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATFORM)
    expect(useSession.getState().account?.kind).toBe('platform')
    expect(useSession.getState().token).toBe('token-plataforma')
    expect(api.calls('post', LOGIN)[0]?.body).toEqual({ email: PLATFORM_RESTHUB_DEV, password: TEST_SECRET })
  })

  it('tras varios intentos fallidos muestra cuándo volver a intentar', async () => {
    const api = platformServer()
    api.on('post', LOGIN, new ErrorResponse(429, 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'))
    const { user } = mountPlatform('/acceso')

    await user.type(await screen.findByLabelText('Correo'), PLATFORM_RESTHUB_DEV)
    await user.type(screen.getByLabelText('Contraseña'), 'otra')
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByText('Demasiados intentos. Vuelve a intentarlo en 15 minutos.')).toBeInTheDocument()
    expect(useSession.getState().account).toBeNull()
  })
})

describe('armazón de la administración del sistema', () => {
  it('es el mismo armazón: dice «Administración del sistema» y solo ofrece las pantallas de plataforma', async () => {
    platformServer()
    signInToPlatform()
    mountPlatform(PLATFORM)

    expect(screen.getAllByText(SYSTEM).length).toBeGreaterThan(0)
    expect(within(menuOf()).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Restaurantes',
      'Bitácora',
      'Vista previa',
      'Observabilidad',
    ])
    expect(screen.queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument()
    await screen.findByRole('heading', { name: RESTAURANTS, level: 1 })
  })

  it('el menú solo ofrece lo que los permisos de la cuenta dejan abrir', async () => {
    platformServer().on('get', '/auth/me', platformSession({ permissions: ['platform.restaurants.read', 'platform.activity.read'] }))
    signInToPlatform(['platform.restaurants.read', 'platform.activity.read'])
    mountPlatform(PLATFORM)

    expect(within(menuOf()).getAllByRole('link').map((link) => link.textContent)).toEqual(['Restaurantes', 'Bitácora'])
    await screen.findByRole('heading', { name: RESTAURANTS, level: 1 })
  })

  it('marca la pantalla actual y lleva a las demás', async () => {
    platformServer().on('get', '/platform/activity', PAGE_EMPTY)
    signInToPlatform()
    const { user } = mountPlatform(PLATFORM)
    const menu = menuOf()

    expect(within(menu).getByRole('link', { name: RESTAURANTS })).toHaveAttribute(CURRENT, 'page')
    await user.click(within(menu).getByRole('link', { name: 'Bitácora' }))

    expect(await screen.findByRole('heading', { name: 'Bitácora', level: 1 })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Bitácora' })).toHaveAttribute(CURRENT, 'page')
    expect(within(menu).getByRole('link', { name: RESTAURANTS })).not.toHaveAttribute(CURRENT)
  })

  it('el alta de un restaurante sigue marcando Restaurantes', async () => {
    platformServer()
    signInToPlatform()
    mountPlatform('/plataforma/restaurantes/nuevo')

    expect(within(menuOf()).getByRole('link', { name: RESTAURANTS })).toHaveAttribute(CURRENT, 'page')
    await screen.findByRole('heading', { level: 1 })
  })

  it('cerrar sesión vuelve al acceso de todos y borra la sesión', async () => {
    platformServer()
    signInToPlatform()
    const { user, router } = mountPlatform(PLATFORM)

    expect(screen.getAllByText(ADMIN.full_name).length).toBeGreaterThan(0)
    await user.click(firstOf(screen.getAllByRole('button', SIGN_OUT)))

    expect(await screen.findByRole('button', SIGN_IN)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/acceso')
    expect(useSession.getState().token).toBeNull()
  })

  it('relee la cuenta con /auth/me', async () => {
    platformServer().on('get', '/auth/me', platformSession({ admin: { ...ADMIN, full_name: 'Soporte RestHub' } }))
    signInToPlatform()
    mountPlatform(PLATFORM)

    expect((await screen.findAllByText('Soporte RestHub')).length).toBeGreaterThan(0)
  })

  it('una sesión del personal abierta no ve las pantallas de plataforma', async () => {
    platformServer().on('get', '/orders', [])
    signInAs()
    const { router } = mountPlatform(PLATFORM)

    // La guarda la lleva al inicio de su cuenta (la primera pantalla que sus permisos abren).
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/pedidos')
    })
  })
})
