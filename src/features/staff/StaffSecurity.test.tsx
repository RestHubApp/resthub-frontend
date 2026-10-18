import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { member, ROLE_OWNER, ROLE_WAITER, TEAM } from '#jest/fixtures/platform'
import { ErrorResponse, firstOf, mountScreen, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
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

  it('el encargado arma el horario y el servidor explica lo que rechaza (RFS-32)', async () => {
    const { api, user } = openStaff()
    api.on('patch', RESTAURANT, new ErrorResponse(422, 'El horario admite hasta 21 tramos.', 'invalid_opening_hours'))

    expect(await screen.findByText('Sin horario: no se marcan accesos fuera de horario.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar tramo' }))
    await user.click(screen.getByRole('button', { name: 'Agregar tramo' }))
    const closes = screen.getAllByLabelText('Cierra')
    await user.clear(firstOf(closes))
    await user.type(firstOf(closes), '12:00')
    expect(screen.getByText('No puede abrir y cerrar a la misma hora.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeDisabled()

    await user.clear(firstOf(closes))
    await user.type(firstOf(closes), '02:00')
    await user.click(screen.getByRole('button', { name: 'Quitar el tramo del martes de 12:00 a 23:00' }))
    await user.click(screen.getByRole('button', { name: 'Guardar horario' }))

    await waitFor(() => {
      expect(api.calls('patch', RESTAURANT)[0]?.body).toEqual({ opening_hours: [{ day: 0, opens: '12:00', closes: '02:00' }] })
    })
    expect(await screen.findByText('El horario admite hasta 21 tramos.')).toBeInTheDocument()
  })
})
