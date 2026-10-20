import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { buildAccount, ErrorResponse, mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { signInToPlatform } from '#jest/fixtures/platform'
import type { PlatformSession, StaffSession } from '@/api/types'
import { useSession } from '@/store/session'
import { TemporaryPasswordView } from './TemporaryPasswordView'

// Contraseñas de prueba, no credenciales reales.
const TEMPORARY = 'temporal-12345'
const OWN = 'una-clave-propia'
const PASSWORD_ROUTE = '/auth/me/password'

async function fillChange(user: { type: (element: Element, text: string) => Promise<void>; click: (element: Element) => Promise<void> }) {
  await user.type(screen.getByLabelText('Contraseña actual'), TEMPORARY)
  await user.type(screen.getByLabelText('Nueva contraseña'), OWN)
  await user.type(screen.getByLabelText('Repite la nueva contraseña'), OWN)
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
}

describe('TemporaryPasswordView', () => {
  it('cambia la contraseña temporal y la sesión sigue sin pedirla', async () => {
    const api = server().on('post', PASSWORD_ROUTE, {
      ...buildAccount(PERMISSIONS_WAITER), access_token: 'token-propio', token_type: 'bearer', expires_in: 3600,
    })
    const account = signInAs(PERMISSIONS_WAITER, { must_change_password: true })
    const { user } = mountScreen(<TemporaryPasswordView account={account} />)

    await user.type(screen.getByLabelText('Contraseña actual'), TEMPORARY)
    await user.type(screen.getByLabelText('Nueva contraseña'), OWN)
    await user.type(screen.getByLabelText('Repite la nueva contraseña'), OWN)
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    await waitFor(() => {
      expect((useSession.getState().account as StaffSession).must_change_password).toBe(false)
    })
    expect(api.calls('post', PASSWORD_ROUTE)[0]?.body).toEqual({ current_password: TEMPORARY, new_password: OWN })
    expect(useSession.getState().token).toBe('token-propio')
  })

  it('«Salir» cierra la sesión', async () => {
    server().on('post', '/auth/logout', null, 204)
    const account = signInAs(PERMISSIONS_WAITER, { must_change_password: true })
    const { user } = mountScreen(<TemporaryPasswordView account={account} />)

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(useSession.getState().token).toBeNull()
  })

  it('la administración del sistema cambia la contraseña del alta y sigue con la sesión de plataforma', async () => {
    const platform: PlatformSession = { ...signInToPlatform(), must_change_password: true }
    useSession.setState({ account: platform })
    const api = server().on('post', PASSWORD_ROUTE, {
      ...platform, must_change_password: false, access_token: 'token-plataforma-propio', token_type: 'bearer', expires_in: 3600,
    })
    const { user } = mountScreen(<TemporaryPasswordView account={platform} />)
    expect(screen.getByText(/^Equipo RestHub, entraste con una contraseña temporal/u)).toBeInTheDocument()

    await fillChange(user)

    await waitFor(() => {
      expect(useSession.getState().token).toBe('token-plataforma-propio')
    })
    expect(useSession.getState().account).toMatchObject({ kind: 'platform', must_change_password: false })
    expect(api.calls('post', PASSWORD_ROUTE)[0]?.body).toEqual({ current_password: TEMPORARY, new_password: OWN })
  })

  it('una contraseña nueva débil muestra el motivo que da el servidor', async () => {
    const reason = 'La contraseña no puede llevar tu nombre, tu correo, el nombre del local ni «RestHub»: se adivina fácil. Elige otra.'
    server().on('post', PASSWORD_ROUTE, new ErrorResponse(422, reason, 'weak_password'))
    const account = signInAs(PERMISSIONS_WAITER, { must_change_password: true })
    const { user } = mountScreen(<TemporaryPasswordView account={account} />)

    await fillChange(user)

    expect(await screen.findByText(reason)).toBeInTheDocument()
    expect((useSession.getState().account as StaffSession).must_change_password).toBe(true)
  })
})
