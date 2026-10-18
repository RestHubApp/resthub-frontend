import { describe, expect, it } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { changeStaffStatus } from '@/api/staff'
import { ErrorResponse, server, signInAs } from '#jest/harness'
import { useReauthentication } from './reauthentication'
import { useSession } from './session'

const STATUS = '/staff/3/status'
const MEMBER = { id: 3, full_name: 'Beto Ríos', email: 'beto@resthub.dev', role_id: 2, role_label: 'Mesero', is_active: false, must_change_password: false, deactivation_reason: '', created_at: '2026-01-01T00:00:00Z' }

function askedForPassword() {
  return new ErrorResponse(403, 'Confirma tu contraseña para seguir.', 'reauthentication_required')
}

describe('acciones críticas con la contraseña confirmada (RFS-21)', () => {
  it('pide la contraseña y repite la acción al confirmarla', async () => {
    signInAs()
    const api = server().on('patch', STATUS, MEMBER).once('patch', STATUS, askedForPassword())

    const saved = changeStaffStatus(3, false)
    await waitFor(() => {
      expect(useReauthentication.getState().isAsking).toBe(true)
    })
    useReauthentication.getState().settle(true)

    await expect(saved).resolves.toEqual(MEMBER)
    expect(api.calls('patch', STATUS)).toHaveLength(2)
    expect(useReauthentication.getState().isAsking).toBe(false)
  })

  it('si la persona desiste, la acción falla con el aviso del servidor y no se repite', async () => {
    signInAs()
    const api = server().on('patch', STATUS, askedForPassword())

    const saved = changeStaffStatus(3, false)
    await waitFor(() => {
      expect(useReauthentication.getState().isAsking).toBe(true)
    })
    useReauthentication.getState().settle(false)

    await expect(saved).rejects.toMatchObject({ code: 'reauthentication_required' })
    expect(api.calls('patch', STATUS)).toHaveLength(1)
  })

  it('una sesión bloqueada por inactividad (423) muestra el desbloqueo', async () => {
    signInAs()
    server().on('patch', STATUS, new ErrorResponse(423, 'La sesión está bloqueada.', 'session_locked'))

    await expect(changeStaffStatus(3, false)).rejects.toMatchObject({ code: 'session_locked' })

    const { account, token } = useSession.getState()
    expect(account?.kind === 'staff' && account.session_locked).toBe(true)
    expect(token).not.toBeNull()
  })
})
