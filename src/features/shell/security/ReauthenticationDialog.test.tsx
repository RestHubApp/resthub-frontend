import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { ErrorResponse, mountScreen, server, signInAs } from '#jest/harness'
import { useReauthentication } from '@/store/reauthentication'
import { useSession } from '@/store/session'
import { ReauthenticationDialog } from './ReauthenticationDialog'

const REAUTHENTICATE = '/auth/me/reauthenticate'
// La contraseña de las cuentas de la semilla de desarrollo, no una credencial real.
const TEST_SECRET = 'resthub123'
const CONFIRMED = { reauthenticated_at: '2026-10-20T15:00:00Z', valid_until: '2026-10-20T15:05:00Z' }
const ASKS_FOR_CODE = 'Escribe el código de verificación.'
const CODE_LABEL = 'Código de verificación'
const CONFIRM = { name: 'Confirmar' }
const PASSWORD_LABEL = 'Tu contraseña'

/** Abre la ventana como lo hace el cliente HTTP: una acción crítica espera la respuesta. */
function openDialog() {
  const api = server()
  signInAs()
  const answer = useReauthentication.getState().ask()
  return { api, answer, ...mountScreen(<ReauthenticationDialog />) }
}

describe('«Confirma tu contraseña» (RFS-21)', () => {
  it('sin verificación en dos pasos confirma con la contraseña y sigue con la acción', async () => {
    const { api, answer, user } = openDialog()
    api.on('post', REAUTHENTICATE, CONFIRMED)

    await user.type(screen.getByLabelText(PASSWORD_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', CONFIRM))

    await expect(answer).resolves.toBe(true)
    expect(api.calls('post', REAUTHENTICATE)[0]?.body).toEqual({ password: TEST_SECRET, rotate_session: true })
    expect(screen.queryByLabelText(CODE_LABEL)).not.toBeInTheDocument()
  })

  it('deja en la sesión el token nuevo que el servidor da al cambiarle el identificador', async () => {
    const { api, answer, user } = openDialog()
    api.on('post', REAUTHENTICATE, { ...CONFIRMED, access_token: 'token-rotado', csrf_token: 'csrf-nuevo' })

    await user.type(screen.getByLabelText(PASSWORD_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', CONFIRM))

    await expect(answer).resolves.toBe(true)
    expect(useSession.getState().token).toBe('token-rotado')
  })

  it('con la verificación en dos pasos pide el código y lo manda con la contraseña', async () => {
    const { api, answer, user } = openDialog()
    api.on('post', REAUTHENTICATE, CONFIRMED).once('post', REAUTHENTICATE, new ErrorResponse(401, ASKS_FOR_CODE, 'two_factor_required'))

    await user.type(screen.getByLabelText(PASSWORD_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', CONFIRM))
    const code = await screen.findByLabelText(CODE_LABEL)
    // Que pida el código no es un error: no aparece ningún aviso.
    expect(screen.queryByText(ASKS_FOR_CODE)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.type(code, '123456')
    await user.click(screen.getByRole('button', CONFIRM))

    await expect(answer).resolves.toBe(true)
    expect(api.calls('post', REAUTHENTICATE)[1]?.body).toEqual({ password: TEST_SECRET, otp_code: '123456', rotate_session: true })
  })

  it('un código equivocado se avisa y la ventana sigue abierta para corregirlo', async () => {
    const { api, user } = openDialog()
    api.on('post', REAUTHENTICATE, new ErrorResponse(401, 'El código de verificación no es correcto.', 'invalid_two_factor_code'))
      .once('post', REAUTHENTICATE, new ErrorResponse(401, ASKS_FOR_CODE, 'two_factor_required'))

    await user.type(screen.getByLabelText(PASSWORD_LABEL), TEST_SECRET)
    await user.click(screen.getByRole('button', CONFIRM))
    await user.type(await screen.findByLabelText(CODE_LABEL), '000000')
    await user.click(screen.getByRole('button', CONFIRM))

    const dialog = screen.getByRole('dialog', { name: 'Confirma tu contraseña' })
    expect(await within(dialog).findByText('El código de verificación no es correcto.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(CODE_LABEL)).toBeInTheDocument()
    expect(useReauthentication.getState().isAsking).toBe(true)
  })

  it('cancelar resuelve que no se confirmó', async () => {
    const { answer, user } = openDialog()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await expect(answer).resolves.toBe(false)
  })
})
