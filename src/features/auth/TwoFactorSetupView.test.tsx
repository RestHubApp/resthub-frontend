import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { signInToPlatform } from '#jest/fixtures/platform'
import { mountScreen, server } from '#jest/harness'
import type { PlatformSession } from '@/api/types'
import { useSession } from '@/store/session'
import { TwoFactorSetupView } from './TwoFactorSetupView'

const TWO_FACTOR = '/auth/me/two-factor'
const OFF = { enabled: false, pending: false, recovery_codes_left: 0 }
const ON = { enabled: true, pending: false, recovery_codes_left: 10 }

function open(status: typeof OFF) {
  const api = server().on('get', TWO_FACTOR, status)
  const account: PlatformSession = { ...signInToPlatform(), two_factor_setup_required: true }
  useSession.setState({ account })
  return { api, account, ...mountScreen(<TwoFactorSetupView account={account} />) }
}

describe('alta obligatoria de los dos pasos en la plataforma (RFS-22)', () => {
  it('ofrece activarla, sin la opción de apagarla', async () => {
    open(OFF)

    expect(screen.getByRole('heading', { name: 'Activa la verificación en dos pasos' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Activar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
  })

  it('ya activa, la plataforma se abre', async () => {
    open(ON)

    await waitFor(() => {
      expect(useSession.getState().account).toMatchObject({ kind: 'platform', two_factor_setup_required: false })
    })
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
  })

  it('al activarla muestra los códigos y abre la plataforma recién con «Ya los guardé»', async () => {
    const { api, user } = open(OFF)
    api.on('post', `${TWO_FACTOR}/setup`, { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/RestHub%3Aana?secret=JBSWY3DPEHPK3PXP&issuer=RestHub' })
      .on('post', `${TWO_FACTOR}/confirm`, { recovery_codes: ['k7m2-pqrs-4tw8-x3yz-5abc-d6e9'] })

    await user.click(await screen.findByRole('button', { name: 'Activar' }))
    const sheet = await screen.findByRole('dialog')
    await user.type(await within(sheet).findByLabelText('Código de la aplicación'), '123456')
    // Como el servidor: tras confirmar ya está activa.
    api.on('get', TWO_FACTOR, ON)
    await user.click(within(sheet).getByRole('button', { name: 'Activar' }))

    expect(await screen.findByRole('list', { name: 'Códigos de recuperación' })).toBeInTheDocument()
    expect(useSession.getState().account).toMatchObject({ two_factor_setup_required: true })
    await user.click(screen.getByRole('button', { name: 'Ya los guardé' }))
    await waitFor(() => {
      expect(useSession.getState().account).toMatchObject({ two_factor_setup_required: false })
    })
  })

  it('«Salir» cierra la sesión', async () => {
    const { api, user } = open(OFF)
    api.on('post', '/auth/logout', null, 204)

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(useSession.getState().account).toBeNull()
  })
})
