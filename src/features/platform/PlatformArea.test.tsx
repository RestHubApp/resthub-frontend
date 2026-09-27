import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { ADMIN, entrarAPlataforma, montarPlataforma } from '#jest/fixtures/plataforma'
import { entrarComo, RespuestaDeError, servidor } from '#jest/harness'
import { usePlatformSession } from '../../store/platformSession'
import { useSession } from '../../store/session'

// Contraseña de prueba, no una credencial real.
const CLAVE_DE_PRUEBA = 'resthub123'

const PLATAFORMA_BITACORA = '/plataforma/bitacora'
const PLATAFORMA_ACCESO = '/plataforma/acceso'
const PLATAFORMA = '/plataforma'
const PLATAFORMA_RESTHUB_DEV = 'plataforma@resthub.dev'

const LOGIN = '/platform/auth/login'
const LISTA = '/platform/restaurants'
const ENTRAR = { name: 'Entrar' }
const PAGINA_VACIA = { items: [], total: 0 }

function servidorDePlataforma() {
  return servidor().on('get', LISTA, PAGINA_VACIA).on('get', '/platform/auth/me', { admin: ADMIN })
}

describe('acceso al área de plataforma', () => {
  it('sin sesión de plataforma, cualquier pantalla del área lleva a su acceso', async () => {
    servidorDePlataforma()
    const { router } = montarPlataforma(PLATAFORMA_BITACORA)

    expect(await screen.findByRole('heading', { name: 'Administración del sistema', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATAFORMA_ACCESO)
  })

  it('una sesión de restaurante abierta no entra al área', async () => {
    servidorDePlataforma()
    entrarComo()
    const { router } = montarPlataforma(PLATAFORMA)

    await screen.findByRole('button', ENTRAR)
    expect(router.state.location.pathname).toBe(PLATAFORMA_ACCESO)
  })

  it('entra con su cuenta y vuelve a la pantalla que quería abrir', async () => {
    const api = servidorDePlataforma().on('get', '/platform/activity', PAGINA_VACIA)
    api.on('post', LOGIN, { access_token: 'token-plataforma', token_type: 'bearer', expires_in: 3600, admin: ADMIN })
    const { user, router } = montarPlataforma(PLATAFORMA_BITACORA)

    await user.type(await screen.findByLabelText('Correo'), PLATAFORMA_RESTHUB_DEV)
    await user.type(screen.getByLabelText('Contraseña'), CLAVE_DE_PRUEBA)
    await user.click(screen.getByRole('button', ENTRAR))

    expect(await screen.findByRole('heading', { name: 'Bitácora', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATAFORMA_BITACORA)
    expect(usePlatformSession.getState().token).toBe('token-plataforma')
    expect(api.llamadas('post', LOGIN)[0]?.body).toEqual({ email: PLATAFORMA_RESTHUB_DEV, password: CLAVE_DE_PRUEBA })
  })

  it('tras varios intentos fallidos muestra cuándo volver a intentar', async () => {
    const api = servidorDePlataforma()
    api.on('post', LOGIN, new RespuestaDeError(429, 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'))
    const { user } = montarPlataforma(PLATAFORMA_ACCESO)

    await user.type(screen.getByLabelText('Correo'), PLATAFORMA_RESTHUB_DEV)
    await user.type(screen.getByLabelText('Contraseña'), 'otra')
    await user.click(screen.getByRole('button', ENTRAR))

    expect(await screen.findByText('Demasiados intentos. Vuelve a intentarlo en 15 minutos.')).toBeInTheDocument()
    expect(usePlatformSession.getState().admin).toBeNull()
  })

  it('explica que la sesión de administración venció', () => {
    servidorDePlataforma()
    usePlatformSession.setState({ expired: true })
    montarPlataforma(PLATAFORMA_ACCESO)

    expect(screen.getByText('Tu sesión de administración venció. Vuelve a entrar.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir al acceso de restaurantes' })).toHaveAttribute('href', '/acceso')
  })
})

describe('franja del área de plataforma', () => {
  it('marca la pantalla actual y lleva a las demás', async () => {
    servidorDePlataforma().on('get', '/platform/activity', PAGINA_VACIA)
    entrarAPlataforma()
    const { user } = montarPlataforma(PLATAFORMA)
    const menu = screen.getByRole('navigation', { name: 'Administración del sistema' })

    expect(within(menu).getByRole('link', { name: 'Restaurantes' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(menu).getByRole('link', { name: 'Bitácora' }))

    expect(await screen.findByRole('heading', { name: 'Bitácora', level: 1 })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Bitácora' })).toHaveAttribute('aria-current', 'page')
  })

  it('cerrar sesión borra solo la sesión de plataforma y vuelve a su acceso', async () => {
    servidorDePlataforma()
    entrarComo()
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATAFORMA)

    expect(screen.getByText(ADMIN.full_name)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('button', ENTRAR)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATAFORMA_ACCESO)
    expect(usePlatformSession.getState().token).toBeNull()
    expect(useSession.getState().token).toBe('token-de-prueba')
  })

  it('relee la cuenta del administrador con /platform/auth/me', async () => {
    servidorDePlataforma().on('get', '/platform/auth/me', { admin: { ...ADMIN, full_name: 'Soporte RestHub' } })
    entrarAPlataforma()
    montarPlataforma(PLATAFORMA)

    expect(await screen.findByText('Soporte RestHub')).toBeInTheDocument()
  })
})
