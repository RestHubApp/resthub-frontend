import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { member, ROLE_OWNER, ROLE_WAITER, TEAM } from '#jest/fixtures/platform'
import { mountScreen, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
import { StaffView } from './StaffView'

const ROSA = { ...member({ id: 9, full_name: 'Rosa Mamani', email: 'rosa@resthub.dev', role_id: 5, role_label: 'Cocina', is_active: false }), deactivated_at: '2026-10-10T15:00:00Z', deactivated_by: 7, deactivation_reason: 'Ya no trabaja en el local' }
const ACCESS = { id: 1, occurred_at: '2026-10-17T15:00:00Z', outcome: 'failed', device: 'Chrome en Android', network: '181.65.2.x', city: '', country: '', new_device: true, new_country: false }

function openStaff() {
  const api = server()
    .on('get', '/staff', { items: [TEAM[0], TEAM[1], ROSA], total: 3 })
    .on('get', '/roles', [ROLE_OWNER, ROLE_WAITER])
    .on('get', '/staff/unused', [])
    .on('get', '/restaurant', { idle_lock_minutes: 10 })
  signInAs(PERMISSIONS_OWNER)
  return { api, ...mountScreen(<StaffView />, { path: '/personal' }) }
}

describe('Personal: bajas y accesos', () => {
  it('una cuenta inactiva dice quién la desactivó, cuándo y por qué (RFS-18)', async () => {
    openStaff()

    const row = await screen.findByRole('row', { name: /Rosa Mamani/u })
    expect(within(row).getByText(/^Desactivada el .* por Ana Torres: Ya no trabaja en el local$/u)).toBeInTheDocument()
  })

  it('muestra los accesos de una persona con sus marcas (RFS-15)', async () => {
    const { api, user } = openStaff()
    api.on('get', '/staff/8/access-history', { items: [ACCESS], total: 1 })

    await user.click(within(await screen.findByRole('row', { name: /Luis Quispe/u })).getByRole('button', { name: 'Más acciones de Luis Quispe' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Accesos' }))
    const sheet = await screen.findByRole('dialog', { name: 'Accesos de Luis Quispe' })

    expect(await within(sheet).findByText('Fallido')).toBeInTheDocument()
    expect(within(sheet).getByText('Dispositivo nuevo')).toBeInTheDocument()
    expect(within(sheet).getByText('Chrome en Android · — · 181.65.2.x')).toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument()
  })
})
