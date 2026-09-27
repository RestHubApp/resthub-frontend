import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { pedido } from '#jest/fixtures/cobro'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor, sinRespuesta } from '#jest/harness'
import type { OrderResponse, PermissionCode } from '../../api/types'
import BoardView from './BoardView'

const ACTIVOS = '/orders/active'
const MINUTO = 60_000

function haceMinutos(minutos: number): string {
  return new Date(Date.now() - minutos * MINUTO).toISOString()
}

const EN_MESA = pedido({ id: 1, number: 1, status: 'open', created_at: haceMinutos(0) })
const EN_COCINA = pedido({ id: 2, number: 2, status: 'in_kitchen', created_at: haceMinutos(40), status_changed_at: haceMinutos(30) })
const LISTO = pedido({
  id: 3,
  number: 3,
  status: 'ready',
  type: 'takeaway',
  table_label: null,
  customer_name: 'Rosa',
  created_at: haceMinutos(20),
  status_changed_at: haceMinutos(16),
})
const SERVIDO = pedido({ id: 12, number: 34, status: 'served', created_at: haceMinutos(50) })

function tablero(pedidos: OrderResponse[] | RespuestaDeError = [EN_MESA, EN_COCINA, LISTO, SERVIDO], permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO) {
  const api = servidor().on('get', ACTIVOS, pedidos).on('get', '/cash/current', { is_open: true, session: null })
  entrarComo(permisos)
  return { api, ...montar(<BoardView />, { path: '/tablero' }) }
}

function columna(nombre: RegExp) {
  return within(screen.getByRole('region', { name: nombre }))
}

describe('BoardView', () => {
  it('reparte los pedidos en una columna por estado, con su cantidad', async () => {
    tablero()

    expect(await screen.findByRole('region', { name: 'Abierto: 1' })).toBeInTheDocument()
    expect(columna(/^En cocina/u).getByRole('link', { name: 'Pedido #2' })).toHaveAttribute('href', '/pedidos/2')
    expect(columna(/^Listo/u).getByText('Para llevar · Rosa')).toBeInTheDocument()
    expect(columna(/^Servido/u).getByRole('button', { name: 'Cobrar' })).toBeInTheDocument()
  })

  it('marca lo nuevo y lo demorado con texto, no solo con color', async () => {
    tablero()

    await screen.findByRole('region', { name: 'Abierto: 1' })
    expect(columna(/^Abierto/u).getByText('Nuevo')).toBeInTheDocument()
    expect(columna(/^En cocina/u).getByText(/Demorado/u)).toBeInTheDocument()
    expect(columna(/^Listo/u).queryByText(/Demorado/u)).not.toBeInTheDocument()
    expect(columna(/^Servido/u).queryByText('Nuevo')).not.toBeInTheDocument()
  })

  it('filtra por tipo con la cantidad de cada uno', async () => {
    const { user } = tablero()

    const filtros = within(await screen.findByRole('group', { name: 'Filtrar por tipo' }))
    expect(await filtros.findByRole('button', { name: 'Todos (4)' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(filtros.getByRole('button', { name: 'Para llevar (1)' }))

    expect(screen.getByRole('region', { name: 'Abierto: 0' })).toHaveTextContent('Sin pedidos')
    expect(screen.getByRole('region', { name: /^Listo: 1/u })).toBeInTheDocument()
  })

  it('el paso siguiente se da desde la tarjeta y se avisa', async () => {
    const { api, user } = tablero()
    api.on('post', '/orders/2/ready', pedido({ id: 2, number: 2, status: 'ready' }))

    await screen.findByRole('region', { name: /^En cocina/u })
    await user.click(columna(/^En cocina/u).getByRole('button', { name: 'Marcar listo' }))

    expect(await screen.findByText('Pedido #2 listo.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/2/ready')).toHaveLength(1)
  })

  it('cobrar y cancelar abren sus ventanas desde el tablero', async () => {
    const { user } = tablero()

    await user.click(await screen.findByRole('button', { name: 'Cobrar' }))
    expect(await screen.findByRole('dialog', { name: 'Cobrar pedido #34' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar pedido #1' }))

    expect(await screen.findByRole('dialog', { name: '¿Cancelar el pedido #1?' })).toBeInTheDocument()
  })

  it('sin permiso de gestionar pedidos no hay «Marcar listo» ni cancelar', async () => {
    tablero([EN_COCINA], ['orders.read_all', 'orders.take'])

    await screen.findByRole('region', { name: 'En cocina: 1' })
    expect(screen.queryByRole('button', { name: 'Marcar listo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancelar pedido/u })).not.toBeInTheDocument()
  })

  it('si no se pueden leer los pedidos lo dice', async () => {
    tablero(new RespuestaDeError(500, 'Sin base de datos'))

    expect(await screen.findByText('Sin base de datos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/tablero/historial')
  })
})

describe('BoardView mientras carga', () => {
  it('muestra las cuatro columnas vacías como esqueleto', async () => {
    servidor().on('get', ACTIVOS, () => sinRespuesta())
    entrarComo()
    montar(<BoardView />)

    expect(await screen.findByText('Servido, por cobrar')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /: \d/u })).not.toBeInTheDocument()
  })
})
