import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { buildAccount, signInAs, mountScreen, PERMISSIONS_WAITER, firstOf, ErrorResponse, server } from '#jest/harness'
import { currentAuthToken } from '@/services/apiCredentials'
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
const CHANGE_PASSWORD_URL = '/auth/me/password'
const ACCESS = '/auth/login'
const NEW_TOKEN = 'token-nuevo'
const NOTICE = 'Tu contraseña cambió. Vuelve a iniciar sesión.'

function openProfile(preview = false, at = '/perfil') {
  const api = server()
  signInAs(PERMISSIONS_WAITER, { preview })
  return { api, ...mountScreen(<ProfileView />, { path: '/perfil', en: at, routes: [{ path: '/acceso', element: <SessionExpiredNotice /> }] }) }
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
    await user.click(screen.getByRole('button', CHANGE))
    await user.type(screen.getByLabelText(ACTUAL), CURRENT_SECRET)
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.type(screen.getByLabelText(REPEAT), NEW_SECRET)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', CHANGE))
  }

  it('cambia la contraseña y sigue con el token nuevo, sin un segundo acceso', async () => {
    const { api, user } = openProfile()
    api.on('post', CHANGE_PASSWORD_URL, { ...buildAccount(PERMISSIONS_WAITER), access_token: NEW_TOKEN, token_type: 'bearer', expires_in: 3600 })

    await changePassword(user)

    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument()
    expect(api.calls('post', CHANGE_PASSWORD_URL)[0]?.body).toEqual({ current_password: CURRENT_SECRET, new_password: NEW_SECRET })
    expect(api.calls('post', ACCESS)).toHaveLength(0)
    expect(useSession.getState().token).toBe(NEW_TOKEN)
    expect(currentAuthToken()).toBe(NEW_TOKEN)
    expect(screen.getByLabelText(ACTUAL)).toHaveValue('')
  })

  it('si la respuesta no trae token, cierra la sesión y vuelve al acceso con el aviso', async () => {
    const { api, user, router } = openProfile()
    api.on('post', CHANGE_PASSWORD_URL, null, 204)

    await changePassword(user)

    expect(await screen.findByText(NOTICE)).toBeVisible()
    expect(router.state.location.pathname).toBe('/acceso')
    expect(useSession.getState().token).toBeNull()
    expect(useSession.getState().passwordChanged).toBe(true)
    expect(api.calls('post', ACCESS)).toHaveLength(0)
  })

  it('si otra pestaña entró con otra cuenta mientras tanto, no pisa ni cierra esa sesión', async () => {
    const { api, user } = openProfile()
    api.on('post', CHANGE_PASSWORD_URL, () => {
      useSession.setState({ token: 'token-de-otra-cuenta' })
      return { ...buildAccount(PERMISSIONS_WAITER), access_token: NEW_TOKEN, token_type: 'bearer', expires_in: 3600 }
    })

    await changePassword(user)

    await waitFor(() => { expect(api.calls('post', CHANGE_PASSWORD_URL)).toHaveLength(1); })
    await new Promise((ready) => setTimeout(ready, 50))
    expect(useSession.getState().token).toBe('token-de-otra-cuenta')
    expect(useSession.getState().passwordChanged).toBe(false)
  })

  it('no envía si las dos contraseñas nuevas no coinciden o repiten la actual', async () => {
    const { api, user } = openProfile()

    await user.click(screen.getByRole('button', CHANGE))
    await user.type(screen.getByLabelText(ACTUAL), NEW_SECRET)
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.type(screen.getByLabelText(REPEAT), 'otra-clave-larga')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', CHANGE))

    expect(await screen.findByText('Las dos contraseñas no coinciden')).toBeInTheDocument()
    expect(screen.getByText('La nueva contraseña tiene que ser distinta de la actual')).toBeInTheDocument()
    expect(api.calls('post', CHANGE_PASSWORD_URL)).toHaveLength(0)
  })

  it('si la actual está mal, muestra el motivo del servidor', async () => {
    const { api, user } = openProfile()
    api.on('post', CHANGE_PASSWORD_URL, new ErrorResponse(400, 'La contraseña actual no coincide.'))

    await user.click(screen.getByRole('button', CHANGE))
    await user.type(screen.getByLabelText(ACTUAL), 'equivocada1')
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.type(screen.getByLabelText(REPEAT), NEW_SECRET)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', CHANGE))

    expect(await screen.findByText('La contraseña actual no coincide.')).toBeInTheDocument()
  })

  it('en una vista previa no ofrece cambiar la contraseña de la cuenta de muestra', () => {
    openProfile(true)

    expect(screen.queryByRole('button', CHANGE)).not.toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
  })

})

describe('ProfileView: ventana de contraseña', () => {
  it('el formulario no ocupa el perfil hasta que se pide', () => {
    openProfile()
    expect(screen.queryByLabelText(ACTUAL)).not.toBeInTheDocument()
  })

  it('se abre sola desde la dirección con ?accion=cambiar-contrasena', async () => {
    openProfile(false, '/perfil?accion=cambiar-contrasena')
    expect(await screen.findByLabelText(ACTUAL)).toBeInTheDocument()
  })

  it('en la vista previa, ?accion=cambiar-contrasena no abre nada y se borra de la dirección', async () => {
    const { router } = openProfile(true, '/perfil?accion=cambiar-contrasena')

    await waitFor(() => {
      expect(router.state.location.search).toBe('')
    })
    expect(screen.queryByLabelText(ACTUAL)).not.toBeInTheDocument()
  })

  it('el botón del ojo deja ver lo que se escribe', async () => {
    const { user } = openProfile()
    await user.click(screen.getByRole('button', CHANGE))
    const field = screen.getByLabelText(ACTUAL)
    expect(field).toHaveAttribute('type', 'password')

    await user.click(firstOf(screen.getAllByRole('button', { name: /mostrar/i })))

    expect(field).toHaveAttribute('type', 'text')
  })
})

// Termina lo que el formulario dejó en promesas (la validación), sin adelantar
// ningún temporizador.
async function settle() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('ProfileView: contraseña tras un intento con errores', () => {
  it('GES-31: corregir la nueva contraseña no termina escrito en «Repite…» y llega el aviso de que repite la actual', async () => {
    const { api, user } = openProfile()
    await user.click(screen.getByRole('button', CHANGE))
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.input(screen.getByLabelText(ACTUAL), { target: { value: NEW_SECRET } })
    fireEvent.input(screen.getByLabelText(NEW), { target: { value: 'otra-clave-larga' } })
    fireEvent.input(screen.getByLabelText(REPEAT), { target: { value: 'otra-cosa-distinta' } })

    // Lo que el envío deje para después espera hasta que «Nueva contraseña» tenga el foco.
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] })
    try {
      fireEvent.click(dialog.getByRole('button', CHANGE))
      await settle()
      expect(screen.getByText('Las dos contraseñas no coinciden')).toBeInTheDocument()
      screen.getByLabelText(NEW).focus()
      act(() => {
        jest.runOnlyPendingTimers()
      })
    } finally {
      jest.useRealTimers()
    }

    expect(screen.getByLabelText(NEW)).toHaveFocus()
    await user.clear(screen.getByLabelText(NEW))
    await user.type(screen.getByLabelText(NEW), NEW_SECRET)
    await user.clear(screen.getByLabelText(REPEAT))
    await user.type(screen.getByLabelText(REPEAT), NEW_SECRET)
    await user.click(dialog.getByRole('button', CHANGE))

    expect(await screen.findByText('La nueva contraseña tiene que ser distinta de la actual')).toBeInTheDocument()
    expect(api.calls('post', CHANGE_PASSWORD_URL)).toHaveLength(0)
  })
})
