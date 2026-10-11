import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { cuenta, entrarComo, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import { currentAuthToken } from '../../services/api'
import { useSession } from '../../store/session'
import ProfileView from './ProfileView'
import SessionExpiredNotice from './SessionExpiredNotice'

// Contraseñas de prueba, no credenciales reales.
const CLAVE_ACTUAL = 'resthub123'
const CLAVE_NUEVA = 'una-clave-larga'
const ACTUAL = 'Contraseña actual'
const NUEVA = 'Nueva contraseña'
const REPETIR = 'Repite la nueva contraseña'
const CAMBIAR = { name: 'Cambiar contraseña' }
const CAMBIO = '/auth/me/password'
const ACCESO = '/auth/login'
const TOKEN_NUEVO = 'token-nuevo'
const AVISO = 'Tu contraseña cambió. Vuelve a iniciar sesión.'

function abrirPerfil(preview = false) {
  const api = servidor()
  entrarComo(PERMISOS_MESERO, { preview })
  return { api, ...montar(<ProfileView />, { path: '/perfil', rutas: [{ path: '/acceso', element: <SessionExpiredNotice /> }] }) }
}

describe('ProfileView', () => {
  it('muestra los datos de la cuenta sin dejar editarlos', () => {
    abrirPerfil()

    expect(screen.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('ana@resthub.dev')).toBeInTheDocument()
    expect(screen.getByText('La Picantería')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Nombre' })).not.toBeInTheDocument()
  })

  async function cambiarClave(user: ReturnType<typeof abrirPerfil>['user']) {
    await user.type(screen.getByLabelText(ACTUAL), CLAVE_ACTUAL)
    await user.type(screen.getByLabelText(NUEVA), CLAVE_NUEVA)
    await user.type(screen.getByLabelText(REPETIR), CLAVE_NUEVA)
    await user.click(screen.getByRole('button', CAMBIAR))
  }

  it('cambia la contraseña y sigue con el token nuevo, sin un segundo acceso', async () => {
    const { api, user } = abrirPerfil()
    api.on('post', CAMBIO, { ...cuenta(PERMISOS_MESERO), access_token: TOKEN_NUEVO, token_type: 'bearer', expires_in: 3600 })

    await cambiarClave(user)

    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument()
    expect(api.llamadas('post', CAMBIO)[0]?.body).toEqual({ current_password: CLAVE_ACTUAL, new_password: CLAVE_NUEVA })
    expect(api.llamadas('post', ACCESO)).toHaveLength(0)
    expect(useSession.getState().token).toBe(TOKEN_NUEVO)
    expect(currentAuthToken()).toBe(TOKEN_NUEVO)
    expect(screen.getByLabelText(ACTUAL)).toHaveValue('')
  })

  it('si la respuesta no trae token, cierra la sesión y vuelve al acceso con el aviso', async () => {
    const { api, user, router } = abrirPerfil()
    api.on('post', CAMBIO, null, 204)

    await cambiarClave(user)

    expect(await screen.findByText(AVISO)).toBeVisible()
    expect(router.state.location.pathname).toBe('/acceso')
    expect(useSession.getState().token).toBeNull()
    expect(useSession.getState().passwordChanged).toBe(true)
    expect(api.llamadas('post', ACCESO)).toHaveLength(0)
  })

  it('no envía si las dos contraseñas nuevas no coinciden o repiten la actual', async () => {
    const { api, user } = abrirPerfil()

    await user.type(screen.getByLabelText(ACTUAL), CLAVE_NUEVA)
    await user.type(screen.getByLabelText(NUEVA), CLAVE_NUEVA)
    await user.type(screen.getByLabelText(REPETIR), 'otra-clave-larga')
    await user.click(screen.getByRole('button', CAMBIAR))

    expect(await screen.findByText('Las dos contraseñas no coinciden')).toBeInTheDocument()
    expect(screen.getByText('La nueva contraseña tiene que ser distinta de la actual')).toBeInTheDocument()
    expect(api.llamadas('post', CAMBIO)).toHaveLength(0)
  })

  it('si la actual está mal, muestra el motivo del servidor', async () => {
    const { api, user } = abrirPerfil()
    api.on('post', CAMBIO, new RespuestaDeError(400, 'La contraseña actual no coincide.'))

    await user.type(screen.getByLabelText(ACTUAL), 'equivocada1')
    await user.type(screen.getByLabelText(NUEVA), CLAVE_NUEVA)
    await user.type(screen.getByLabelText(REPETIR), CLAVE_NUEVA)
    await user.click(screen.getByRole('button', CAMBIAR))

    expect(await screen.findByText('La contraseña actual no coincide.')).toBeInTheDocument()
  })

  it('en una vista previa no ofrece cambiar la contraseña de la cuenta de muestra', () => {
    abrirPerfil(true)

    expect(screen.queryByRole('button', CAMBIAR)).not.toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
  })

  it('el botón del ojo deja ver lo que se escribe', async () => {
    const { user } = abrirPerfil()
    const campo = screen.getByLabelText(ACTUAL)
    expect(campo).toHaveAttribute('type', 'password')

    await user.click(screen.getAllByRole('button', { name: /mostrar/i })[0])

    expect(campo).toHaveAttribute('type', 'text')
  })
})
