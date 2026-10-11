import { describe, expect, it } from '@jest/globals'
import { fireEvent, screen, within } from '@testing-library/react'

import { mesa, reserva } from '#jest/fixtures/panel'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import { ReservationsView } from './ReservationsView'

const EDIT_URL = '/reservations/21'
const LIST = '/reservations'
const TO_NAME = 'A nombre de'
const TABLE = 'Mesa (opcional)'
const TERRACE = 'Terraza'

const DAY = '2026-09-25'
const SAVE = { name: 'Guardar' }
const PERSONAS = 'Personas'

function open() {
  const api = servidor()
    .on('get', LIST, (request: { params: Record<string, unknown> }) => (request.params['day'] === DAY ? [reserva()] : []))
    .on('get', '/tables', [mesa(1, '1'), mesa(2, '2'), mesa(3, TERRACE)])
  entrarComo()
  const mount = montar(<ReservationsView />)
  fireEvent.change(screen.getByLabelText('Día'), { target: { value: DAY } })
  return { api, ...mount }
}

async function fresh(user: ReturnType<typeof open>['user']) {
  await user.click(screen.getByRole('button', { name: 'Nueva reserva' }))
  return screen.findByRole('dialog', { name: 'Nueva reserva' })
}

describe('ReservationDialog', () => {
  it('una reserva nueva viaja con la hora del local en UTC y la mesa elegida', async () => {
    const { api, user } = open()
    api.on('post', LIST, reserva({ id: 22, customer_name: 'Carlos' }))
    const window = within(await fresh(user))

    expect(window.getByLabelText('Día')).toHaveValue(DAY)
    expect(window.getByLabelText('Hora')).toHaveValue('20:00')
    await user.type(window.getByLabelText(TO_NAME), 'Carlos')
    await user.clear(window.getByLabelText(PERSONAS))
    await user.type(window.getByLabelText(PERSONAS), '6')
    await user.selectOptions(await window.findByLabelText(TABLE), TERRACE)
    await user.click(window.getByRole('button', SAVE))

    expect(await screen.findByText('Reserva de Carlos guardada.')).toBeInTheDocument()
    expect(api.llamadas('post', LIST)[0]?.body).toEqual({
      customer_name: 'Carlos',
      phone: '',
      party_size: 6,
      reserved_for: '2026-09-26T01:00:00.000Z',
      duration_minutes: 120,
      table_id: 3,
      notes: '',
    })
  })

  it('valida el nombre, las personas y la duración antes de enviar', async () => {
    const { api, user } = open()
    const window = within(await fresh(user))

    await user.clear(window.getByLabelText(PERSONAS))
    await user.type(window.getByLabelText(PERSONAS), '0')
    await user.clear(window.getByLabelText('Duración (minutos)'))
    await user.type(window.getByLabelText('Duración (minutos)'), 'dos')
    await user.click(window.getByRole('button', SAVE))

    expect(await window.findByText('Escribe a nombre de quién')).toBeInTheDocument()
    expect(window.getByText('Entre 1 y 50')).toBeInTheDocument()
    expect(window.getByText('Escribe los minutos en números')).toBeInTheDocument()
    expect(api.llamadas('post', LIST)).toHaveLength(0)
  })

  it('editar parte de los datos guardados y, sin tocar nada, conserva la mesa y la hora', async () => {
    const { api, user } = open()
    api.on('put', EDIT_URL, reserva())

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const window = within(await screen.findByRole('dialog', { name: 'Reserva de Familia Huamán' }))
    expect(window.getByLabelText(TO_NAME)).toHaveValue('Familia Huamán')
    expect(window.getByLabelText('Hora')).toHaveValue('20:00')
    expect(window.getByLabelText('Día')).toHaveValue(DAY)
    await window.findByRole('option', { name: TERRACE })

    await user.click(window.getByRole('button', SAVE))

    expect(await screen.findByText('Reserva de Familia Huamán guardada.')).toBeInTheDocument()
    expect(api.llamadas('put', EDIT_URL)[0]?.body).toMatchObject({
      table_id: 2,
      party_size: 4,
      reserved_for: '2026-09-26T01:00:00.000Z',
      notes: 'Cumpleaños',
    })
  })

  it('quitar la mesa al editar la envía como null', async () => {
    const { api, user } = open()
    api.on('put', EDIT_URL, reserva({ table_id: null }))

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const window = within(await screen.findByRole('dialog'))
    await window.findByRole('option', { name: TERRACE })
    await user.selectOptions(window.getByLabelText(TABLE), 'Mesa 1')
    await user.selectOptions(window.getByLabelText(TABLE), 'Sin mesa asignada')
    await user.click(window.getByRole('button', SAVE))

    expect(await screen.findByText('Reserva de Familia Huamán guardada.')).toBeInTheDocument()
    expect(api.llamadas('put', EDIT_URL)[0]?.body).toMatchObject({ table_id: null })
  })

  it('si la mesa ya está tomada en ese horario, el error queda en la ventana', async () => {
    const { api, user } = open()
    api.on('post', LIST, new RespuestaDeError(409, 'La mesa ya está reservada a esa hora'))
    const dialog = await fresh(user)
    const window = within(dialog)

    await user.type(window.getByLabelText(TO_NAME), 'Carlos')
    await user.click(window.getByRole('button', SAVE))

    expect(await window.findByText('La mesa ya está reservada a esa hora')).toBeInTheDocument()
    await user.click(window.getByRole('button', { name: 'Cancelar' }))
    expect(dialog).not.toBeInTheDocument()
  })
})
