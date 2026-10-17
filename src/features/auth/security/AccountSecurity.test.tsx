import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { useSession } from '@/store/session'
import { AccountSecurity } from './AccountSecurity'

const SESSIONS = '/auth/me/sessions'
const TWO_FACTOR = '/auth/me/two-factor'
const THIS_DEVICE = { id: 'aa11', device: 'Chrome en Windows', network: '190.42.17.x', city: 'Lima', country: 'PE', created_at: '2026-10-17T13:00:00Z', last_seen_at: '2026-10-17T15:00:00Z', current: true }
const PHONE = { ...THIS_DEVICE, id: 'bb22', device: 'Safari en iPhone', city: '', country: '', current: false }
const OFF = { enabled: false, pending: false, recovery_codes_left: 0 }
const CODES = ['abcdefghjk', 'mnpqrstuvw']

function openSecurity(twoFactor = OFF) {
  const api = server().on('get', SESSIONS, [THIS_DEVICE, PHONE]).on('get', TWO_FACTOR, twoFactor)
  const account = signInAs(PERMISSIONS_WAITER)
  return { api, ...mountScreen(<AccountSecurity account={account} />) }
}

describe('seguridad de la cuenta en Mi perfil', () => {
  it('lista las sesiones abiertas y cierra la de otro dispositivo (RFS-17)', async () => {
    const { api, user } = openSecurity()
    api.on('delete', `${SESSIONS}/bb22`, null, 204)

    const list = await screen.findByRole('list', { name: 'Sesiones abiertas' })
    expect(within(list).getByText('Este dispositivo')).toBeInTheDocument()
    expect(within(list).getByText(/Lugar desconocido/u)).toBeInTheDocument()
    expect(within(list).queryByRole('button', { name: 'Cerrar la sesión de Chrome en Windows' })).not.toBeInTheDocument()
    await user.click(within(list).getByRole('button', { name: 'Cerrar la sesión de Safari en iPhone' }))

    await waitFor(() => {
      expect(api.calls('delete', `${SESSIONS}/bb22`)).toHaveLength(1)
    })
  })

  it('cierra las sesiones de los demás dispositivos tras confirmarlo', async () => {
    const { api, user } = openSecurity()
    api.on('delete', SESSIONS, null, 204)

    await user.click(await screen.findByRole('button', { name: 'Cerrar las demás' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cerrar las demás' }))

    await waitFor(() => {
      expect(api.calls('delete', SESSIONS)).toHaveLength(1)
    })
  })

  it('activa la verificación en dos pasos con el QR y muestra los códigos una vez (RFS-22)', async () => {
    const { api, user } = openSecurity()
    api.on('post', `${TWO_FACTOR}/setup`, { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/RestHub%3Aana?secret=JBSWY3DPEHPK3PXP&issuer=RestHub' })
      .on('post', `${TWO_FACTOR}/confirm`, { recovery_codes: CODES })

    await user.click(await screen.findByRole('button', { name: 'Activar' }))
    const sheet = await screen.findByRole('dialog')
    expect(await within(sheet).findByRole('img', { name: 'Código QR para la aplicación de verificación' })).toBeInTheDocument()
    expect(within(sheet).getByText('JBSW Y3DP EHPK 3PXP')).toBeInTheDocument()
    await user.type(within(sheet).getByLabelText('Código de la aplicación'), '123456')
    await user.click(within(sheet).getByRole('button', { name: 'Activar' }))

    const codes = await within(sheet).findByRole('list', { name: 'Códigos de recuperación' })
    expect(within(codes).getByText('abcde-fghjk')).toBeInTheDocument()
    expect(api.calls('post', `${TWO_FACTOR}/confirm`)[0]?.body).toEqual({ code: '123456' })
  })

  it('elige un PIN escrito dos veces y lo anota en la sesión (RFS-29)', async () => {
    const { api, user } = openSecurity()
    api.on('put', '/auth/me/pin', null, 204)

    await user.click(await screen.findByRole('button', { name: 'Elegir un PIN' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('PIN nuevo'), '4321')
    await user.type(within(dialog).getByLabelText('Repite el PIN'), '4321')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar PIN' }))

    await waitFor(() => {
      const { account } = useSession.getState()
      expect(account?.kind === 'staff' && account.has_pin).toBe(true)
    })
    expect(api.calls('put', '/auth/me/pin')[0]?.body).toEqual({ pin: '4321' })
  })

  it('la vista previa no muestra la seguridad de la cuenta', () => {
    server()
    const account = signInAs(PERMISSIONS_WAITER, { preview: true })
    mountScreen(<AccountSecurity account={account} />)

    expect(screen.queryByText('Sesiones abiertas')).not.toBeInTheDocument()
  })
})
