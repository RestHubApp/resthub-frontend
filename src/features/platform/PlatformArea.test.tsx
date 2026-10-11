import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { ADMIN, entrarAPlataforma, montarPlataforma } from '#jest/fixtures/plataforma'
import { entrarComo, RespuestaDeError, servidor } from '#jest/harness'
import { usePlatformSession } from '@/store/platformSession'
import { useSession } from '@/store/session'

// Contraseña de prueba, no una credencial real.
const TEST_SECRET = 'resthub123'

const PLATFORM_LOG = '/plataforma/bitacora'
const PLATFORM_ACCESS = '/plataforma/acceso'
const PLATFORM = '/plataforma'
const PLATFORM_RESTHUB_DEV = 'plataforma@resthub.dev'

const LOGIN = '/platform/auth/login'
const LIST = '/platform/restaurants'
const SIGN_IN = { name: 'Entrar' }
const PAGE_EMPTY = { items: [], total: 0 }

function platformServer() {
  return servidor().on('get', LIST, PAGE_EMPTY).on('get', '/platform/auth/me', { admin: ADMIN })
}

describe('acceso al área de plataforma', () => {
  it('sin sesión de plataforma, cualquier pantalla del área lleva a su acceso', async () => {
    platformServer()
    const { router } = montarPlataforma(PLATFORM_LOG)

    expect(await screen.findByRole('heading', { name: 'Administración del sistema', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATFORM_ACCESS)
  })

  it('una sesión de restaurante abierta no entra al área', async () => {
    platformServer()
    entrarComo()
    const { router } = montarPlataforma(PLATFORM)

    await screen.findByRole('button', SIGN_IN)
    expect(router.state.location.pathname).toBe(PLATFORM_ACCESS)
  })

  it('entra con su cuenta y vuelve a la pantalla que quería abrir', async () => {
    const api = platformServer().on('get', '/platform/activity', PAGE_EMPTY)
    api.on('post', LOGIN, { access_token: 'token-plataforma', token_type: 'bearer', expires_in: 3600, admin: ADMIN })
    const { user, router } = montarPlataforma(PLATFORM_LOG)

    await user.type(await screen.findByLabelText('Correo'), PLATFORM_RESTHUB_DEV)
    await user.type(screen.getByLabelText('Contraseña'), TEST_SECRET)
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByRole('heading', { name: 'Bitácora', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATFORM_LOG)
    expect(usePlatformSession.getState().token).toBe('token-plataforma')
    expect(api.llamadas('post', LOGIN)[0]?.body).toEqual({ email: PLATFORM_RESTHUB_DEV, password: TEST_SECRET })
  })

  it('tras varios intentos fallidos muestra cuándo volver a intentar', async () => {
    const api = platformServer()
    api.on('post', LOGIN, new RespuestaDeError(429, 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'))
    const { user } = montarPlataforma(PLATFORM_ACCESS)

    await user.type(screen.getByLabelText('Correo'), PLATFORM_RESTHUB_DEV)
    await user.type(screen.getByLabelText('Contraseña'), 'otra')
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByText('Demasiados intentos. Vuelve a intentarlo en 15 minutos.')).toBeInTheDocument()
    expect(usePlatformSession.getState().admin).toBeNull()
  })

  it('explica que la sesión de administración venció', () => {
    platformServer()
    usePlatformSession.setState({ expired: true })
    montarPlataforma(PLATFORM_ACCESS)

    expect(screen.getByText('Tu sesión de administración venció. Vuelve a entrar.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir al acceso de restaurantes' })).toHaveAttribute('href', '/acceso')
  })
})

describe('franja del área de plataforma', () => {
  it('marca la pantalla actual y lleva a las demás', async () => {
    platformServer().on('get', '/platform/activity', PAGE_EMPTY)
    entrarAPlataforma()
    const { user } = montarPlataforma(PLATFORM)
    const menu = screen.getByRole('navigation', { name: 'Administración del sistema' })

    expect(within(menu).getByRole('link', { name: 'Restaurantes' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(menu).getByRole('link', { name: 'Bitácora' }))

    expect(await screen.findByRole('heading', { name: 'Bitácora', level: 1 })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Bitácora' })).toHaveAttribute('aria-current', 'page')
  })

  it('cerrar sesión borra solo la sesión de plataforma y vuelve a su acceso', async () => {
    platformServer()
    entrarComo()
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATFORM)

    expect(screen.getByText(ADMIN.full_name)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('button', SIGN_IN)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATFORM_ACCESS)
    expect(usePlatformSession.getState().token).toBeNull()
    expect(useSession.getState().token).toBe('token-de-prueba')
  })

  it('relee la cuenta del administrador con /platform/auth/me', async () => {
    platformServer().on('get', '/platform/auth/me', { admin: { ...ADMIN, full_name: 'Soporte RestHub' } })
    entrarAPlataforma()
    montarPlataforma(PLATFORM)

    expect(await screen.findByText('Soporte RestHub')).toBeInTheDocument()
  })
})
