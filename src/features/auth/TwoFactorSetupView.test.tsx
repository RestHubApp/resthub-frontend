import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

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

  it('«Salir» cierra la sesión', async () => {
    const { api, user } = open(OFF)
    api.on('post', '/auth/logout', null, 204)

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(useSession.getState().account).toBeNull()
  })
})
