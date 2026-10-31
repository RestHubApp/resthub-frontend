import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { FAKE_SETUP_VIEWS } from '#jest/accountSetupViews'
import { ErrorResponse, mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { signInToPlatform } from '#jest/fixtures/platform'
import { send } from '@/api/client'
import { beginTwoFactor } from '@/api/twoFactor'
import { useSession } from '@/store/session'
import { AccountSetupGate } from './AccountSetupGate'

const CONTENT = 'Pedidos del salón'
const SETUP_TWO_FACTOR = 'Activa los dos pasos, Equipo RestHub'
const PLATFORM_PASSWORD = 'Cambia tu contraseña, Equipo RestHub'
const TWO_FACTOR_SETUP = '/auth/me/two-factor/setup'

/** Como en el armazón: la cuenta sale del almacén de sesión. */
function Gate() {
  const account = useSession((state) => state.account)
  return account === null ? null : <AccountSetupGate account={account} views={FAKE_SETUP_VIEWS}><p>{CONTENT}</p></AccountSetupGate>
}

describe('contraseña temporal (RFS-20)', () => {
  it('con la contraseña temporal solo se ve el cambio', async () => {
    server()
    signInAs(PERMISSIONS_WAITER, { must_change_password: true })
    mountScreen(<Gate />)

    expect(await screen.findByRole('heading', { name: 'Cambia tu contraseña, Ana Torres' })).toBeInTheDocument()
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
  })

  it('la vista previa nunca la pide', () => {
    server()
    signInAs(PERMISSIONS_WAITER, { must_change_password: true, preview: true })
    mountScreen(<Gate />)

    expect(screen.getByText(CONTENT)).toBeInTheDocument()
  })

  it('un 403 password_change_required de cualquier petición lleva al cambio', async () => {
    server().on('get', '/tables', new ErrorResponse(403, 'Cambia la contraseña temporal antes de seguir.', 'password_change_required'))
    signInAs(PERMISSIONS_WAITER)
    mountScreen(<Gate />)
    expect(screen.getByText(CONTENT)).toBeInTheDocument()

    await expect(send((client) => client.GET('/api/v1/tables'))).rejects.toMatchObject({ code: 'password_change_required' })

    await waitFor(() => {
      expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
    })
    expect(useSession.getState().token).not.toBeNull()
  })
})

describe('verificación en dos pasos obligatoria en la plataforma (RFS-22)', () => {
  it('sin activarla solo se ve el alta', async () => {
    server()
    useSession.setState({ account: { ...signInToPlatform(), two_factor_setup_required: true } })
    mountScreen(<Gate />)

    expect(await screen.findByRole('heading', { name: SETUP_TWO_FACTOR })).toBeInTheDocument()
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
  })

  it('un 403 two_factor_setup_required lleva al alta', async () => {
    server().on('get', '/platform/restaurants', new ErrorResponse(403, 'Activa la verificación en dos pasos.', 'two_factor_setup_required'))
    signInToPlatform()
    mountScreen(<Gate />)
    expect(screen.getByText(CONTENT)).toBeInTheDocument()

    await expect(send((client) => client.GET('/api/v1/platform/restaurants'))).rejects.toMatchObject({ code: 'two_factor_setup_required' })

    expect(await screen.findByRole('heading', { name: SETUP_TWO_FACTOR })).toBeInTheDocument()
  })

  it('el alta pide la contraseña aunque el armazón no esté montado', async () => {
    const setup = { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/RestHub:admin?secret=JBSWY3DPEHPK3PXP' }
    const api = server()
      .on('post', TWO_FACTOR_SETUP, setup)
      .once('post', TWO_FACTOR_SETUP, new ErrorResponse(403, 'Confirma tu contraseña para seguir.', 'reauthentication_required'))
      .on('post', '/auth/me/reauthenticate', { reauthenticated_at: '2026-10-20T15:00:00Z', valid_until: '2026-10-20T15:05:00Z' })
    useSession.setState({ account: { ...signInToPlatform(), two_factor_setup_required: true } })
    const { user } = mountScreen(<Gate />)
    expect(await screen.findByRole('heading', { name: SETUP_TWO_FACTOR })).toBeInTheDocument()

    const started = beginTwoFactor()
    const dialog = await screen.findByRole('dialog', { name: 'Confirma tu contraseña' })
    // La contraseña de las cuentas de la semilla de desarrollo, no una credencial real.
    await user.type(within(dialog).getByLabelText('Tu contraseña'), 'resthub123')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar' }))

    await expect(started).resolves.toEqual(setup)
    expect(api.calls('post', TWO_FACTOR_SETUP)).toHaveLength(2)
  })
})

describe('contraseña temporal de la plataforma (ASVS 6.2.2)', () => {
  it('con la contraseña del alta solo se ve el cambio, antes que los dos pasos', async () => {
    server()
    useSession.setState({ account: { ...signInToPlatform(), must_change_password: true, two_factor_setup_required: true } })
    mountScreen(<Gate />)

    expect(await screen.findByRole('heading', { name: PLATFORM_PASSWORD })).toBeInTheDocument()
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
  })

  it('un 403 password_change_required de la plataforma lleva al cambio', async () => {
    server().on('get', '/platform/restaurants', new ErrorResponse(403, 'Cambia la contraseña antes de seguir.', 'password_change_required'))
    signInToPlatform()
    mountScreen(<Gate />)
    expect(screen.getByText(CONTENT)).toBeInTheDocument()

    await expect(send((client) => client.GET('/api/v1/platform/restaurants'))).rejects.toMatchObject({ code: 'password_change_required' })

    expect(await screen.findByRole('heading', { name: PLATFORM_PASSWORD })).toBeInTheDocument()
    expect(useSession.getState().account).toMatchObject({ kind: 'platform', must_change_password: true })
  })
})
