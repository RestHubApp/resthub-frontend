import { describe, expect, it } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'

import { mesa, reserva } from '#jest/fixtures/panel'
import { entrarComo, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import type { Reservation } from '../../api/types'
import ReservationsView from './ReservationsView'

const ESTADO = '/reservations/21/status'

const DIA = '2026-09-25'
const LISTA = '/reservations'
const FAMILIA = 'Familia Huamán'

function abrir(reservas: Reservation[] = [reserva()], permisos?: Parameters<typeof entrarComo>[0]) {
  const api = servidor()
    .on('get', LISTA, (peticion: { params: Record<string, unknown> }) => (peticion.params.day === DIA ? reservas : []))
    .on('get', '/tables', [mesa(1, '1'), mesa(2, '2'), mesa(3, 'Terraza')])
  entrarComo(permisos)
  const montaje = montar(<ReservationsView />)
  fireEvent.change(screen.getByLabelText('Día'), { target: { value: DIA } })
  return { api, ...montaje }
}

describe('ReservationsView: el día', () => {
  it('lista las reservas del día con hora del local, personas, mesa y notas', async () => {
    abrir()
    expect(await screen.findByText(FAMILIA)).toBeInTheDocument()
    expect(screen.getByText('8:00 p. m.')).toBeInTheDocument()
    expect(screen.getByText('4 personas · Mesa 2 · 912345678 · Cumpleaños')).toBeInTheDocument()
    expect(screen.getByText('Reservada')).toBeInTheDocument()
  })

  it('una reserva sin mesa lo dice; el mesero no ve acciones ni puede crear', async () => {
    abrir([reserva({ table_id: null, phone: '', notes: '' })], PERMISOS_MESERO)
    expect(await screen.findByText('4 personas · sin mesa')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Llegaron' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nueva reserva' })).not.toBeInTheDocument()
  })

  it('otro día sin reservas lo dice y pide ese día al servidor', async () => {
    const { api } = abrir()
    await screen.findByText(FAMILIA)

    fireEvent.change(screen.getByLabelText('Día'), { target: { value: '2031-01-15' } })

    expect(await screen.findByText('No hay reservas para este día')).toBeInTheDocument()
    expect(api.llamadas('get', LISTA).at(-1)?.params).toEqual({ day: '2031-01-15' })
  })

  it('una reserva que ya llegó no ofrece acciones', async () => {
    abrir([reserva({ status: 'seated', status_label: 'Llegaron' })])
    expect(await screen.findByText(FAMILIA)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('si la lista falla muestra el error', async () => {
    servidor().on('get', LISTA, new RespuestaDeError(500, 'Sin base')).on('get', '/tables', [])
    entrarComo()
    montar(<ReservationsView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})

describe('ReservationsView: estado', () => {
  it('«Llegaron» cambia el estado y lo avisa', async () => {
    const { api, user } = abrir()
    api.on('post', ESTADO, reserva({ status: 'seated', status_label: 'Llegaron' }))

    await user.click(await screen.findByRole('button', { name: 'Llegaron' }))

    expect(await screen.findByText(`${FAMILIA}: Llegaron.`)).toBeInTheDocument()
    expect(api.llamadas('post', ESTADO)[0]?.params).toEqual({ value: 'seated' })
  })

  it('si el servidor rechaza el cambio lo avisa', async () => {
    const { api, user } = abrir()
    api.on('post', ESTADO, new RespuestaDeError(409, 'La reserva ya se canceló'))

    await user.click(await screen.findByRole('button', { name: 'No vinieron' }))

    expect(await screen.findByText('La reserva ya se canceló')).toBeInTheDocument()
    expect(api.llamadas('post', ESTADO)[0]?.params).toEqual({ value: 'no_show' })
  })
})
