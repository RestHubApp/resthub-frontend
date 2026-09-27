import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { cuenta, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import { useSession } from '../../store/session'
import LoginView from './LoginView'

const CORREO = 'Correo'
const CLAVE = 'Contraseña'
const ENTRAR = { name: 'Entrar' }
const LOGIN = '/auth/login'
// La contraseña de las cuentas de la semilla de desarrollo, no una credencial real.
const CLAVE_DE_PRUEBA = 'resthub123'

function respuestaDeAcceso() {
  const { user, restaurant, permissions, preview } = cuenta(PERMISOS_MESERO)
  return { access_token: 'token-nuevo', token_type: 'bearer', expires_in: 3600, user, restaurant, permissions, preview }
}

function abrirAcceso(estado?: { from: string }) {
  const api = servidor()
  const montaje = montar(<LoginView />, { path: '/acceso' })
  if (estado) {
    void montaje.router.navigate('/acceso', { state: estado })
  }
  return { api, ...montaje }
}

describe('LoginView', () => {
  it('entra con el correo y la contraseña, abre la sesión y va al inicio', async () => {
    const { api, user } = abrirAcceso()
    api.on('post', LOGIN, respuestaDeAcceso())

    await user.type(screen.getByLabelText(CORREO), 'mesero@resthub.dev')
    await user.type(screen.getByLabelText(CLAVE), CLAVE_DE_PRUEBA)
    await user.click(screen.getByRole('button', ENTRAR))

    expect(await screen.findByRole('status', { name: 'Ruta actual' })).toHaveTextContent(/^\/$/u)
    expect(api.llamadas('post', LOGIN)[0]?.body).toEqual({ email: 'mesero@resthub.dev', password: CLAVE_DE_PRUEBA })
    expect(useSession.getState().token).toBe('token-nuevo')
    expect(useSession.getState().account?.permissions).toEqual([...PERMISOS_MESERO])
  })

  it('vuelve a la pantalla que se quiso abrir antes de entrar', async () => {
    const { api, user } = abrirAcceso({ from: '/caja' })
    api.on('post', LOGIN, respuestaDeAcceso())

    await user.type(screen.getByLabelText(CORREO), 'ana@resthub.dev')
    await user.type(screen.getByLabelText(CLAVE), CLAVE_DE_PRUEBA)
    await user.click(screen.getByRole('button', ENTRAR))

    expect(await screen.findByRole('status', { name: 'Ruta actual' })).toHaveTextContent('/caja')
  })

  it('con una contraseña equivocada muestra el mensaje del servidor y no abre sesión', async () => {
    const { api, user } = abrirAcceso()
    api.on('post', LOGIN, new RespuestaDeError(401, 'Correo o contraseña incorrectos.'))

    await user.type(screen.getByLabelText(CORREO), 'ana@resthub.dev')
    await user.type(screen.getByLabelText(CLAVE), 'otra-clave')
    await user.click(screen.getByRole('button', ENTRAR))

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(useSession.getState().token).toBeNull()
  })

  it('valida el correo y la contraseña antes de enviar', async () => {
    const { api, user } = abrirAcceso()

    await user.type(screen.getByLabelText(CORREO), 'no-es-correo')
    await user.click(screen.getByRole('button', ENTRAR))

    expect(await screen.findByText('Escribe tu contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText(CORREO)).toHaveAttribute('aria-invalid', 'true')
    expect(api.llamadas('post', LOGIN)).toHaveLength(0)
  })

  it('explica que la sesión venció cuando se volvió al acceso por eso', () => {
    useSession.setState({ expired: true })
    abrirAcceso()

    expect(screen.getByText('Tu sesión venció. Vuelve a entrar para seguir donde estabas.')).toBeVisible()
  })

  it('ofrece la entrada a la administración del sistema', () => {
    abrirAcceso()

    expect(screen.getByRole('link', { name: 'Administración del sistema' })).toHaveAttribute('href', '/plataforma/acceso')
  })
})
