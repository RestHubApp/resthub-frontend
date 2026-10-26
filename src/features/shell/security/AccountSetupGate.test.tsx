import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { FAKE_SETUP_VIEWS } from '#jest/accountSetupViews'
import { ErrorResponse, mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { signInToPlatform } from '#jest/fixtures/platform'
import { send } from '@/api/client'
import { useSession } from '@/store/session'
import { AccountSetupGate } from './AccountSetupGate'

const CONTENT = 'Pedidos del salón'
const SETUP_TWO_FACTOR = 'Activa los dos pasos, Equipo RestHub'
const PLATFORM_PASSWORD = 'Cambia tu contraseña, Equipo RestHub'

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
})

describe('verificación en dos pasos obligatoria para quien administra el personal (RFS-22)', () => {
  it('sin activarla solo se ve el alta', async () => {
    server()
    signInAs(undefined, { two_factor_setup_required: true })
    mountScreen(<Gate />)

    expect(await screen.findByRole('heading', { name: 'Activa los dos pasos, Ana Torres' })).toBeInTheDocument()
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
  })

  it('un 403 two_factor_setup_required de cualquier petición lleva al alta', async () => {
    server().on('get', '/staff', new ErrorResponse(403, 'Activa la verificación en dos pasos.', 'two_factor_setup_required'))
    signInAs()
    mountScreen(<Gate />)
    expect(screen.getByText(CONTENT)).toBeInTheDocument()

    await expect(send((client) => client.GET('/api/v1/staff'))).rejects.toMatchObject({ code: 'two_factor_setup_required' })

    expect(await screen.findByRole('heading', { name: 'Activa los dos pasos, Ana Torres' })).toBeInTheDocument()
  })

  it('la vista previa nunca la pide', () => {
    server()
    signInAs(undefined, { two_factor_setup_required: true, preview: true })
    mountScreen(<Gate />)

    expect(screen.getByText(CONTENT)).toBeInTheDocument()
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
