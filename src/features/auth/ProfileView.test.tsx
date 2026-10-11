import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { cuenta, entrarComo, montar, PERMISOS_MESERO, primero, RespuestaDeError, servidor } from '#jest/harness'
import { currentAuthToken } from '@/services/api'
import { useSession } from '@/store/session'
import { ProfileView } from './ProfileView'
import { SessionExpiredNotice } from './SessionExpiredNotice'

// Contraseñas de prueba, no credenciales reales.
const CURRENT_SECRET = 'resthub123'
const NEW_SECRET = 'una-clave-larga'
const ACTUAL = 'Contraseña actual'
const NEW = 'Nueva contraseña'
const REPEAT = 'Repite la nueva contraseña'
const CHANGE = { name: 'Cambiar contraseña' }
const CHANGEValue = '/auth/me/password'
const ACCESS = '/auth/login'
const NEW_TOKEN = 'token-nuevo'
const NOTICE = 'Tu contraseña cambió. Vuelve a iniciar sesión.'

function openProfile(preview = false) {
  const api = servidor()
  entrarComo(PERMISOS_MESERO, { preview })
  return { api, ...montar(<ProfileView />, { path: '/perfil', rutas: [{ path: '/acceso', element: <SessionExpiredNotice /> }] }) }
}

describe('ProfileView', () => {
  it('muestra los datos de la cuenta sin dejar editarlos', () => {
    openProfile()

    expect(screen.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('ana@resthub.dev')).toBeInTheDocument()
    expect(screen.getByText('La Picantería')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Nombre' })).not.toBeInTheDocument()
  })

  async function changePassword(user: ReturnType<typeof openProfile>['user']) {
    await user.type(screen.getByLabelText(ACTUAL), CURRENT_SECRET)
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.type(screen.getByLabelText(REPEAT), NEW_SECRET)
    await user.click(screen.getByRole('button', CHANGE))
  }

  it('cambia la contraseña y sigue con el token nuevo, sin un segundo acceso', async () => {
    const { api, user } = openProfile()
    api.on('post', CHANGEValue, { ...cuenta(PERMISOS_MESERO), access_token: NEW_TOKEN, token_type: 'bearer', expires_in: 3600 })

    await changePassword(user)

    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument()
    expect(api.llamadas('post', CHANGEValue)[0]?.body).toEqual({ current_password: CURRENT_SECRET, new_password: NEW_SECRET })
    expect(api.llamadas('post', ACCESS)).toHaveLength(0)
    expect(useSession.getState().token).toBe(NEW_TOKEN)
    expect(currentAuthToken()).toBe(NEW_TOKEN)
    expect(screen.getByLabelText(ACTUAL)).toHaveValue('')
  })

  it('si la respuesta no trae token, cierra la sesión y vuelve al acceso con el aviso', async () => {
    const { api, user, router } = openProfile()
    api.on('post', CHANGEValue, null, 204)

    await changePassword(user)

    expect(await screen.findByText(NOTICE)).toBeVisible()
    expect(router.state.location.pathname).toBe('/acceso')
    expect(useSession.getState().token).toBeNull()
    expect(useSession.getState().passwordChanged).toBe(true)
    expect(api.llamadas('post', ACCESS)).toHaveLength(0)
  })

  it('si otra pestaña entró con otra cuenta mientras tanto, no pisa ni cierra esa sesión', async () => {
    const { api, user } = openProfile()
    api.on('post', CHANGEValue, () => {
      useSession.setState({ token: 'token-de-otra-cuenta' })
      return { ...cuenta(PERMISOS_MESERO), access_token: NEW_TOKEN, token_type: 'bearer', expires_in: 3600 }
    })

    await changePassword(user)

    await waitFor(() => { expect(api.llamadas('post', CHANGEValue)).toHaveLength(1); })
    await new Promise((ready) => setTimeout(ready, 50))
    expect(useSession.getState().token).toBe('token-de-otra-cuenta')
    expect(useSession.getState().passwordChanged).toBe(false)
  })

  it('no envía si las dos contraseñas nuevas no coinciden o repiten la actual', async () => {
    const { api, user } = openProfile()

    await user.type(screen.getByLabelText(ACTUAL), NEW_SECRET)
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.type(screen.getByLabelText(REPEAT), 'otra-clave-larga')
    await user.click(screen.getByRole('button', CHANGE))

    expect(await screen.findByText('Las dos contraseñas no coinciden')).toBeInTheDocument()
    expect(screen.getByText('La nueva contraseña tiene que ser distinta de la actual')).toBeInTheDocument()
    expect(api.llamadas('post', CHANGEValue)).toHaveLength(0)
  })

  it('si la actual está mal, muestra el motivo del servidor', async () => {
    const { api, user } = openProfile()
    api.on('post', CHANGEValue, new RespuestaDeError(400, 'La contraseña actual no coincide.'))

    await user.type(screen.getByLabelText(ACTUAL), 'equivocada1')
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.type(screen.getByLabelText(REPEAT), NEW_SECRET)
    await user.click(screen.getByRole('button', CHANGE))

    expect(await screen.findByText('La contraseña actual no coincide.')).toBeInTheDocument()
  })

  it('en una vista previa no ofrece cambiar la contraseña de la cuenta de muestra', () => {
    openProfile(true)

    expect(screen.queryByRole('button', CHANGE)).not.toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
  })

  it('el botón del ojo deja ver lo que se escribe', async () => {
    const { user } = openProfile()
    const field = screen.getByLabelText(ACTUAL)
    expect(field).toHaveAttribute('type', 'password')

    await user.click(primero(screen.getAllByRole('button', { name: /mostrar/i })))

    expect(field).toHaveAttribute('type', 'text')
  })
})
