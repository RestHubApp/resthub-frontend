import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { buildAccount, mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import type { StaffSession } from '@/api/types'
import { useSession } from '@/store/session'
import { TemporaryPasswordView } from './TemporaryPasswordView'

// Contraseñas de prueba, no credenciales reales.
const TEMPORARY = 'temporal-12345'
const OWN = 'una-clave-propia'

describe('TemporaryPasswordView', () => {
  it('cambia la contraseña temporal y la sesión sigue sin pedirla', async () => {
    const api = server().on('post', '/auth/me/password', {
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
    expect(api.calls('post', '/auth/me/password')[0]?.body).toEqual({ current_password: TEMPORARY, new_password: OWN })
    expect(useSession.getState().token).toBe('token-propio')
  })

  it('«Salir» cierra la sesión', async () => {
    server().on('post', '/auth/logout', null, 204)
    const account = signInAs(PERMISSIONS_WAITER, { must_change_password: true })
    const { user } = mountScreen(<TemporaryPasswordView account={account} />)

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(useSession.getState().token).toBeNull()
  })
})
