import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { itemDePedido, notaConAlergia, pedido } from '#jest/fixtures/pedidos'
import { entrarComo, montar, PERMISOS_ENCARGADO, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import { KitchenView } from './KitchenView'

const IN_KITCHEN = pedido({
  notes: 'Mesa de cumpleaños',
  items: [
    itemDePedido({ quantity: 2, notes: 'alérgico al maní' }),
    itemDePedido({ id: 102, name: 'Chicha morada', modifiers: [{ group: 'Tamaño', option: 'Jarra', price: '12.00' }] }),
  ],
})
const READY = pedido({ id: 6, number: 13, status: 'ready', type: 'takeaway', table_label: null, customer_name: 'Luis' })
const NOTES = '/insights/order-notes'

function open(permissions = PERMISOS_ENCARGADO, active = [IN_KITCHEN, READY]) {
  const api = servidor()
    .on('get', '/orders/active', active)
    .on('get', NOTES, { items: [notaConAlergia()] })
    .on('post', '/orders/5/ready', pedido({ status: 'ready' }))
  entrarComo(permissions)
  return { api, ...montar(<KitchenView />, { path: '/cocina' }) }
}

describe('KitchenView', () => {
  it('separa lo que falta preparar de lo que espera salir, sin precios', async () => {
    open()
    const card = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(screen.getByRole('heading', { name: 'Por preparar (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Listos para servir (1)' })).toBeInTheDocument()
    expect(within(card).getByText('Mesa 3')).toBeInTheDocument()
    expect(within(card).getByText('Jarra')).toBeInTheDocument()
    expect(within(card).getByText('Mesa de cumpleaños')).toBeInTheDocument()
    expect(within(card).queryByText(/S\//u)).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Pedido 13' })).toHaveTextContent('Para llevar · Luis')
  })

  it('con el panel, la alergia de una nota se marca en la tarjeta', async () => {
    const { api } = open()
    const card = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(await within(card).findByText('Con alergia')).toBeInTheDocument()
    expect(api.llamadas('get', NOTES)[0]?.params).toEqual({ order_ids: [5, 6] })
  })

  it('quien no ve el panel no pregunta por las alergias', async () => {
    const { api } = open(PERMISOS_MESERO)
    const card = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(within(card).getByText('alérgico al maní')).toBeInTheDocument()
    expect(within(card).queryByText('Con alergia')).not.toBeInTheDocument()
    expect(api.llamadas('get', NOTES)).toHaveLength(0)
  })

  it('el encargado marca un pedido listo; el mesero solo mira', async () => {
    const { api, user } = open()
    const card = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(within(screen.getByRole('article', { name: 'Pedido 13' })).queryByRole('button', { name: 'Listo' })).not.toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: 'Listo' }))
    expect(await screen.findByText('Pedido #12 listo.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/5/ready')).toHaveLength(1)
  })

  it('un mesero no tiene el botón de listo', async () => {
    open(PERMISOS_MESERO)
    const card = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(within(card).queryByRole('button', { name: 'Listo' })).not.toBeInTheDocument()
  })

  it('sin pedidos lo dice en cada columna', async () => {
    open(PERMISOS_MESERO, [])
    expect(await screen.findByText('Nada pendiente en cocina')).toBeInTheDocument()
    expect(screen.getByText('Nada esperando a salir')).toBeInTheDocument()
  })

  it('si los pedidos no cargan, avisa', async () => {
    servidor().on('get', '/orders/active', new RespuestaDeError(500, 'Error del servidor'))
    entrarComo(PERMISOS_MESERO)
    montar(<KitchenView />)
    expect(await screen.findByText('Error del servidor')).toBeInTheDocument()
  })
})
