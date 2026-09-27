import { describe, expect, it } from '@jest/globals'
import { fireEvent, screen, within } from '@testing-library/react'

import { mesa, reserva } from '#jest/fixtures/panel'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import ReservationsView from './ReservationsView'

const EDITAR_URL = '/reservations/21'
const LISTA = '/reservations'
const A_NOMBRE = 'A nombre de'
const MESA = 'Mesa (opcional)'
const TERRAZA = 'Terraza'

const DIA = '2026-09-25'
const GUARDAR = { name: 'Guardar' }
const PERSONAS = 'Personas'

function abrir() {
  const api = servidor()
    .on('get', LISTA, (peticion: { params: Record<string, unknown> }) => (peticion.params.day === DIA ? [reserva()] : []))
    .on('get', '/tables', [mesa(1, '1'), mesa(2, '2'), mesa(3, TERRAZA)])
  entrarComo()
  const montaje = montar(<ReservationsView />)
  fireEvent.change(screen.getByLabelText('Día'), { target: { value: DIA } })
  return { api, ...montaje }
}

async function nueva(user: ReturnType<typeof abrir>['user']) {
  await user.click(screen.getByRole('button', { name: 'Nueva reserva' }))
  return screen.findByRole('dialog', { name: 'Nueva reserva' })
}

describe('ReservationDialog', () => {
  it('una reserva nueva viaja con la hora del local en UTC y la mesa elegida', async () => {
    const { api, user } = abrir()
    api.on('post', LISTA, reserva({ id: 22, customer_name: 'Carlos' }))
    const ventana = within(await nueva(user))

    expect(ventana.getByLabelText('Día')).toHaveValue(DIA)
    expect(ventana.getByLabelText('Hora')).toHaveValue('20:00')
    await user.type(ventana.getByLabelText(A_NOMBRE), 'Carlos')
    await user.clear(ventana.getByLabelText(PERSONAS))
    await user.type(ventana.getByLabelText(PERSONAS), '6')
    await user.selectOptions(await ventana.findByLabelText(MESA), TERRAZA)
    await user.click(ventana.getByRole('button', GUARDAR))

    expect(await screen.findByText('Reserva de Carlos guardada.')).toBeInTheDocument()
    expect(api.llamadas('post', LISTA)[0]?.body).toEqual({
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
    const { api, user } = abrir()
    const ventana = within(await nueva(user))

    await user.clear(ventana.getByLabelText(PERSONAS))
    await user.type(ventana.getByLabelText(PERSONAS), '0')
    await user.clear(ventana.getByLabelText('Duración (minutos)'))
    await user.type(ventana.getByLabelText('Duración (minutos)'), 'dos')
    await user.click(ventana.getByRole('button', GUARDAR))

    expect(await ventana.findByText('Escribe a nombre de quién')).toBeInTheDocument()
    expect(ventana.getByText('Entre 1 y 50')).toBeInTheDocument()
    expect(ventana.getByText('Escribe los minutos en números')).toBeInTheDocument()
    expect(api.llamadas('post', LISTA)).toHaveLength(0)
  })

  it('editar parte de los datos guardados y, sin tocar nada, conserva la mesa y la hora', async () => {
    const { api, user } = abrir()
    api.on('put', EDITAR_URL, reserva())

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const ventana = within(await screen.findByRole('dialog', { name: 'Reserva de Familia Huamán' }))
    expect(ventana.getByLabelText(A_NOMBRE)).toHaveValue('Familia Huamán')
    expect(ventana.getByLabelText('Hora')).toHaveValue('20:00')
    expect(ventana.getByLabelText('Día')).toHaveValue(DIA)
    await ventana.findByRole('option', { name: TERRAZA })

    await user.click(ventana.getByRole('button', GUARDAR))

    expect(await screen.findByText('Reserva de Familia Huamán guardada.')).toBeInTheDocument()
    expect(api.llamadas('put', EDITAR_URL)[0]?.body).toMatchObject({
      table_id: 2,
      party_size: 4,
      reserved_for: '2026-09-26T01:00:00.000Z',
      notes: 'Cumpleaños',
    })
  })

  it('quitar la mesa al editar la envía como null', async () => {
    const { api, user } = abrir()
    api.on('put', EDITAR_URL, reserva({ table_id: null }))

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const ventana = within(await screen.findByRole('dialog'))
    await ventana.findByRole('option', { name: TERRAZA })
    await user.selectOptions(ventana.getByLabelText(MESA), 'Mesa 1')
    await user.selectOptions(ventana.getByLabelText(MESA), 'Sin mesa asignada')
    await user.click(ventana.getByRole('button', GUARDAR))

    expect(await screen.findByText('Reserva de Familia Huamán guardada.')).toBeInTheDocument()
    expect(api.llamadas('put', EDITAR_URL)[0]?.body).toMatchObject({ table_id: null })
  })

  it('si la mesa ya está tomada en ese horario, el error queda en la ventana', async () => {
    const { api, user } = abrir()
    api.on('post', LISTA, new RespuestaDeError(409, 'La mesa ya está reservada a esa hora'))
    const dialogo = await nueva(user)
    const ventana = within(dialogo)

    await user.type(ventana.getByLabelText(A_NOMBRE), 'Carlos')
    await user.click(ventana.getByRole('button', GUARDAR))

    expect(await ventana.findByText('La mesa ya está reservada a esa hora')).toBeInTheDocument()
    await user.click(ventana.getByRole('button', { name: 'Cancelar' }))
    expect(dialogo).not.toBeInTheDocument()
  })
})
