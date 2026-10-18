import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { member, ROLE_OWNER, ROLE_WAITER, TEAM } from '#jest/fixtures/platform'
import { mountScreen, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
import { StaffView } from './StaffView'

const RESTAURANT = '/restaurant'
const LUIS_STATUS = '/staff/8/status'
const LUIS_SESSIONS = '/staff/8/sessions'
const PHONE = { id: 'cc33', device: 'Chrome en Android', network: '181.65.2.x', city: 'Arequipa', country: 'PE', created_at: '2026-10-17T13:00:00Z', last_seen_at: '2026-10-17T15:00:00Z', current: false }
const UNUSED = [{ member: member(), last_activity_at: null, unused_days: 75 }]

function openStaff(unused: unknown = []) {
  const api = server()
    .on('get', '/staff', { items: TEAM, total: TEAM.length })
    .on('get', '/roles', [ROLE_OWNER, ROLE_WAITER])
    .on('get', '/staff/unused', unused)
    .on('get', RESTAURANT, { idle_lock_minutes: 10 })
  signInAs(PERMISSIONS_OWNER)
  return { api, ...mountScreen(<StaffView />, { path: '/personal' }) }
}

describe('seguridad del personal', () => {
  it('propone desactivar las cuentas sin uso en 60 días (RFS-24)', async () => {
    const { api, user } = openStaff(UNUSED)
    api.on('patch', LUIS_STATUS, { ...member(), is_active: false })

    const list = await screen.findByRole('list', { name: 'Cuentas sin uso' })
    expect(within(list).getByText('Nunca entró · creada hace 75 días')).toBeInTheDocument()
    await user.click(within(list).getByRole('button', { name: 'Desactivar' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(api.calls('patch', LUIS_STATUS)[0]?.body).toEqual({ is_active: false, reason: 'Sin uso en 75 días (revisión de accesos).' })
    })
  })

  it('sin cuentas sin uso no muestra la tarjeta', async () => {
    openStaff()

    expect(await screen.findByRole('row', { name: /Luis Quispe/u })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Cuentas sin uso' })).not.toBeInTheDocument()
  })

  it('muestra y cierra las sesiones abiertas de una persona (RFS-17)', async () => {
    const { api, user } = openStaff()
    api.on('get', LUIS_SESSIONS, [PHONE]).on('delete', LUIS_SESSIONS, null, 204)

    const row = await screen.findByRole('row', { name: /Luis Quispe/u })
    await user.click(within(row).getByRole('button', { name: 'Más acciones de Luis Quispe' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sesiones abiertas' }))
    const sheet = await screen.findByRole('dialog', { name: 'Sesiones de Luis Quispe' })
    expect(await within(sheet).findByText('Chrome en Android')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Cerrar todas' }))

    await waitFor(() => {
      expect(api.calls('delete', LUIS_SESSIONS)).toHaveLength(1)
    })
  })

  it('el encargado cambia los minutos del bloqueo por inactividad (RFS-29)', async () => {
    const { api, user } = openStaff()
    api.on('patch', RESTAURANT, { idle_lock_minutes: 5 })

    const field = await screen.findByLabelText('Minutos sin uso antes de bloquear (0 lo apaga)')
    await waitFor(() => { expect(field).toHaveValue('10') })
    await user.clear(field)
    await user.type(field, '5')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(api.calls('patch', RESTAURANT)[0]?.body).toEqual({ idle_lock_minutes: 5 })
    })
  })
})
