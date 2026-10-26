import { beforeEach, describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { buildAccount, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server } from '#jest/harness'
import type { PermissionCode } from '@/api/types'
import { useSession } from '@/store/session'
import { useSignInTip } from '@/store/signInTip'
import { TwoFactorReminder } from './TwoFactorReminder'

const TWO_FACTOR = '/auth/me/two-factor'
const OFF = { enabled: false, pending: false, recovery_codes_left: 0, recovery_codes_outdated: false }
const ON = { ...OFF, enabled: true, recovery_codes_left: 10 }
const TITLE = { name: 'Protege tu cuenta con la verificación en dos pasos' }

/** Como al entrar: la pestaña pasa de no tener cuenta a tenerla. */
function enter(permissions: readonly PermissionCode[], status: typeof OFF, changes = {}) {
  const api = server().on('get', TWO_FACTOR, status)
  useSession.setState({ token: null, account: null })
  const account = buildAccount(permissions, changes)
  useSession.setState({ token: 'token-de-prueba', account })
  return { api, ...mountScreen(<TwoFactorReminder account={account} />) }
}

beforeEach(() => {
  useSignInTip.setState({ pending: false })
})

describe('recomendación de la verificación en dos pasos al entrar (RFS-22)', () => {
  it('al encargado que no la usa se la recomienda, y «Ahora no» la cierra', async () => {
    const { user } = enter(PERMISSIONS_OWNER, OFF)

    expect(await screen.findByRole('alertdialog', TITLE)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ahora no' }))

    expect(screen.queryByRole('alertdialog', TITLE)).not.toBeInTheDocument()
    expect(useSignInTip.getState().pending).toBe(false)
  })

  it('«Activarla ahora» lleva al perfil', async () => {
    const { user } = enter(PERMISSIONS_OWNER, OFF)

    await user.click(await screen.findByRole('button', { name: 'Activarla ahora' }))

    expect(await screen.findByRole('status', { name: 'Ruta actual' })).toHaveTextContent('/perfil')
  })

  it('a quien ya la usa no le dice nada', async () => {
    const { api } = enter(PERMISSIONS_OWNER, ON)

    await waitFor(() => {
      expect(api.calls('get', TWO_FACTOR)).toHaveLength(1)
    })

    expect(screen.queryByRole('alertdialog', TITLE)).not.toBeInTheDocument()
  })

  it('al mesero no se la recomienda ni pregunta por ella', () => {
    const { api } = enter(PERMISSIONS_WAITER, OFF)

    expect(screen.queryByRole('alertdialog', TITLE)).not.toBeInTheDocument()
    expect(api.calls('get', TWO_FACTOR)).toHaveLength(0)
  })

  it('espera a que la cuenta acepte los términos', () => {
    const { api } = enter(PERMISSIONS_OWNER, OFF, { terms_accepted: false })

    expect(screen.queryByRole('alertdialog', TITLE)).not.toBeInTheDocument()
    expect(api.calls('get', TWO_FACTOR)).toHaveLength(0)
  })

  it('en una vista previa no aparece', () => {
    enter(PERMISSIONS_OWNER, OFF, { preview: true })

    expect(screen.queryByRole('alertdialog', TITLE)).not.toBeInTheDocument()
  })
})
