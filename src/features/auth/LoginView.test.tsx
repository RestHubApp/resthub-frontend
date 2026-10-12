import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { buildAccount, mountScreen, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import { useSession } from '@/store/session'
import { LoginView } from './LoginView'

const EMAIL = 'Correo'
const SECRET_LABEL = 'Contraseña'
const SIGN_IN = { name: 'Entrar' }
const LOGIN = '/auth/login'
// La contraseña de las cuentas de la semilla de desarrollo, no una credencial real.
const TEST_SECRET = 'resthub123'
const WHERE = { name: 'Ruta actual' }
const PLATFORM_EMAIL = 'plataforma@resthub.dev'

function accessResponse() {
  const { kind, user, restaurant, permissions, preview: isPreview } = buildAccount(PERMISSIONS_WAITER)
  return { access_token: 'token-nuevo', token_type: 'bearer', expires_in: 3600, kind, user, restaurant, permissions, preview: isPreview }
}

function openAccess(status?: { from: string }) {
  const api = server()
  const mount = mountScreen(<LoginView />, { path: '/acceso' })
  if (status) {
    void mount.router.navigate('/acceso', { state: status })
  }
  return { api, ...mount }
}

describe('LoginView', () => {
  it('entra con el correo y la contraseña, abre la sesión y va al inicio', async () => {
    const { api, user } = openAccess()
    api.on('post', LOGIN, accessResponse())

    await user.type(screen.getByLabelText(EMAIL), 'mesero@resthub.dev')
    await user.type(screen.getByLabelText(SECRET_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByRole('status', WHERE)).toHaveTextContent(/^\/$/u)
    expect(api.calls('post', LOGIN)[0]?.body).toEqual({ email: 'mesero@resthub.dev', password: TEST_SECRET })
    expect(useSession.getState().token).toBe('token-nuevo')
    expect(useSession.getState().account?.permissions).toEqual([...PERMISSIONS_WAITER])
  })

  it('vuelve a la pantalla que se quiso abrir antes de entrar', async () => {
    const { api, user } = openAccess({ from: '/caja' })
    api.on('post', LOGIN, accessResponse())

    await user.type(screen.getByLabelText(EMAIL), 'ana@resthub.dev')
    await user.type(screen.getByLabelText(SECRET_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByRole('status', WHERE)).toHaveTextContent('/caja')
  })

  it('con una contraseña equivocada muestra el mensaje del servidor y no abre sesión', async () => {
    const { api, user } = openAccess()
    api.on('post', LOGIN, new ErrorResponse(401, 'Correo o contraseña incorrectos.'))

    await user.type(screen.getByLabelText(EMAIL), 'ana@resthub.dev')
    await user.type(screen.getByLabelText(SECRET_LABEL), 'otra-clave')
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(useSession.getState().token).toBeNull()
  })

  it('valida el correo y la contraseña antes de enviar', async () => {
    const { api, user } = openAccess()

    await user.type(screen.getByLabelText(EMAIL), 'no-es-correo')
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByText('Escribe tu contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText(EMAIL)).toHaveAttribute('aria-invalid', 'true')
    expect(api.calls('post', LOGIN)).toHaveLength(0)
  })

  it('explica que la sesión venció cuando se volvió al acceso por eso', () => {
    useSession.setState({ expired: true })
    openAccess()

    expect(screen.getByText('Tu sesión venció. Vuelve a entrar para seguir donde estabas.')).toBeVisible()
  })

  it('no ofrece otra puerta para la administración del sistema: el acceso es uno solo', () => {
    openAccess()

    expect(screen.queryByRole('link', { name: 'Administración del sistema' })).not.toBeInTheDocument()
  })

  it('una cuenta de plataforma entra por el mismo formulario y abre su sesión', async () => {
    const { api, user } = openAccess()
    api.on('post', LOGIN, {
      access_token: 'token-plataforma',
      token_type: 'bearer',
      expires_in: 3600,
      kind: 'platform',
      admin: { id: 1, email: PLATFORM_EMAIL, full_name: 'Equipo RestHub' },
      permissions: ['platform.restaurants.read'],
      preview: false,
    })

    await user.type(screen.getByLabelText(EMAIL), PLATFORM_EMAIL)
    await user.type(screen.getByLabelText(SECRET_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', SIGN_IN))

    expect(await screen.findByRole('status', WHERE)).toHaveTextContent(/^\/$/u)
    expect(useSession.getState().token).toBe('token-plataforma')
    expect(useSession.getState().account).toMatchObject({ kind: 'platform', permissions: ['platform.restaurants.read'] })
  })
})
