import { describe, expect, it } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'

import { table, reservation } from '#jest/fixtures/panel'
import { signInAs, handleMount, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import type { Reservation } from '@/api/types'
import { ReservationsView } from './ReservationsView'

const STATUS = '/reservations/21/status'

const DAY = '2026-09-25'
const LIST = '/reservations'
const FAMILY = 'Familia Huamán'

function open(reservations: Reservation[] = [reservation()], permissions?: Parameters<typeof signInAs>[0]) {
  const api = server()
    .on('get', LIST, (request: { params: Record<string, unknown> }) => (request.params['day'] === DAY ? reservations : []))
    .on('get', '/tables', [table(1, '1'), table(2, '2'), table(3, 'Terraza')])
  signInAs(permissions)
  const mount = handleMount(<ReservationsView />)
  fireEvent.change(screen.getByLabelText('Día'), { target: { value: DAY } })
  return { api, ...mount }
}

describe('ReservationsView: el día', () => {
  it('lista las reservas del día con hora del local, personas, mesa y notas', async () => {
    open()
    expect(await screen.findByText(FAMILY)).toBeInTheDocument()
    expect(screen.getByText('8:00 p. m.')).toBeInTheDocument()
    expect(screen.getByText('4 personas · Mesa 2 · 912345678 · Cumpleaños')).toBeInTheDocument()
    expect(screen.getByText('Reservada')).toBeInTheDocument()
  })

  it('una reserva sin mesa lo dice; el mesero no ve acciones ni puede crear', async () => {
    open([reservation({ table_id: null, phone: '', notes: '' })], PERMISSIONS_WAITER)
    expect(await screen.findByText('4 personas · sin mesa')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Llegaron' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nueva reserva' })).not.toBeInTheDocument()
  })

  it('otro día sin reservas lo dice y pide ese día al servidor', async () => {
    const { api } = open()
    await screen.findByText(FAMILY)

    fireEvent.change(screen.getByLabelText('Día'), { target: { value: '2031-01-15' } })

    expect(await screen.findByText('No hay reservas para este día')).toBeInTheDocument()
    expect(api.calls('get', LIST).at(-1)?.params).toEqual({ day: '2031-01-15' })
  })

  it('una reserva que ya llegó no ofrece acciones', async () => {
    open([reservation({ status: 'seated', status_label: 'Llegaron' })])
    expect(await screen.findByText(FAMILY)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('si la lista falla muestra el error', async () => {
    server().on('get', LIST, new ErrorResponse(500, 'Sin base')).on('get', '/tables', [])
    signInAs()
    handleMount(<ReservationsView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})

describe('ReservationsView: estado', () => {
  it('«Llegaron» cambia el estado y lo avisa', async () => {
    const { api, user } = open()
    api.on('post', STATUS, reservation({ status: 'seated', status_label: 'Llegaron' }))

    await user.click(await screen.findByRole('button', { name: 'Llegaron' }))

    expect(await screen.findByText(`${FAMILY}: Llegaron.`)).toBeInTheDocument()
    expect(api.calls('post', STATUS)[0]?.params).toEqual({ value: 'seated' })
  })

  it('si el servidor rechaza el cambio lo avisa', async () => {
    const { api, user } = open()
    api.on('post', STATUS, new ErrorResponse(409, 'La reserva ya se canceló'))

    await user.click(await screen.findByRole('button', { name: 'No vinieron' }))

    expect(await screen.findByText('La reserva ya se canceló')).toBeInTheDocument()
    expect(api.calls('post', STATUS)[0]?.params).toEqual({ value: 'no_show' })
  })
})
