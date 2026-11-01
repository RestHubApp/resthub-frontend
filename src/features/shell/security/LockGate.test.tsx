import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen } from '@testing-library/react'

import { ErrorResponse, mountScreen, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { useSession } from '@/store/session'
import { LockGate } from './LockGate'

const UNLOCK = '/auth/me/unlock'
const LOCK = '/auth/me/lock'
const UNLOCK_BUTTON = { name: 'Desbloquear' }
const CONTENT = 'Pedidos del salón'
// La contraseña de las cuentas de la semilla de desarrollo, no una credencial real.
const TEST_SECRET = 'resthub123'

/** Como en el armazón: la cuenta sale del almacén de sesión y se vuelve a leer al cambiar. */
function Gate() {
  const account = useSession((state) => state.account)
  return account === null ? null : <LockGate account={account}><p>{CONTENT}</p></LockGate>
}

function mountLocked(changes: { has_pin?: boolean; session_locked?: boolean; idle_lock_minutes?: number } = {}) {
  const api = server()
  signInAs(PERMISSIONS_WAITER, { session_locked: true, has_pin: true, ...changes })
  return { api, ...mountScreen(<Gate />) }
}

function isLocked(): boolean {
  const { account } = useSession.getState()
  return account?.kind === 'staff' && account.session_locked
}

describe('bloqueo de la sesión por inactividad (RFS-29)', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('bloqueada, tapa el contenido y se abre con el PIN', async () => {
    const { api, user } = mountLocked()
    api.on('post', UNLOCK, null, 204)

    expect(await screen.findByRole('heading', { name: 'Sesión bloqueada' })).toBeInTheDocument()
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('PIN'), '4321')
    await user.click(screen.getByRole('button', UNLOCK_BUTTON))

    expect(await screen.findByText(CONTENT)).toBeInTheDocument()
    expect(api.calls('post', UNLOCK)[0]?.body).toEqual({ pin: '4321', rotate_session: true })
    expect(isLocked()).toBe(false)
  })

  it('un PIN equivocado muestra cuántos intentos quedan', async () => {
    const { api, user } = mountLocked()
    api.on('post', UNLOCK, new ErrorResponse(400, 'El PIN no es correcto. Te quedan 2 intentos.', 'wrong_pin'))

    await user.type(await screen.findByLabelText('PIN'), '0000')
    await user.click(screen.getByRole('button', UNLOCK_BUTTON))

    expect(await screen.findByText('El PIN no es correcto. Te quedan 2 intentos.')).toBeInTheDocument()
    expect(isLocked()).toBe(true)
  })

  it('el tercer intento equivocado cierra la sesión', async () => {
    const { api, user } = mountLocked()
    api.on('post', UNLOCK, new ErrorResponse(401, 'Se cerró la sesión.', 'unlock_attempts_exhausted'))

    await user.type(await screen.findByLabelText('PIN'), '2222')
    await user.click(screen.getByRole('button', UNLOCK_BUTTON))

    await act(async () => { await Promise.resolve() })
    expect(useSession.getState().token).toBeNull()
  })

  it('sin PIN se desbloquea con la contraseña', async () => {
    const { api, user } = mountLocked({ has_pin: false })
    api.on('post', UNLOCK, null, 204)

    await user.type(await screen.findByLabelText('Tu contraseña'), TEST_SECRET)
    await user.click(screen.getByRole('button', UNLOCK_BUTTON))

    expect(await screen.findByText(CONTENT)).toBeInTheDocument()
    expect(api.calls('post', UNLOCK)[0]?.body).toEqual({ password: TEST_SECRET, rotate_session: true })
  })

  it('se bloquea sola tras los minutos sin uso del restaurante', async () => {
    jest.useFakeTimers()
    const { api } = mountLocked({ session_locked: false, idle_lock_minutes: 10 })
    api.on('post', LOCK, null, 204)

    expect(screen.getByText(CONTENT)).toBeInTheDocument()
    await act(async () => { await jest.advanceTimersByTimeAsync(9 * 60_000) })
    expect(isLocked()).toBe(false)
    await act(async () => { await jest.advanceTimersByTimeAsync(2 * 60_000) })

    expect(isLocked()).toBe(true)
    expect(api.calls('post', LOCK)).toHaveLength(1)
  })
})
