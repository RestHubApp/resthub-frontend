import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { itemDePedido, notaConAlergia, pedido } from '#jest/fixtures/pedidos'
import { entrarComo, montar, PERMISOS_ENCARGADO, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import KitchenView from './KitchenView'

const EN_COCINA = pedido({
  notes: 'Mesa de cumpleaños',
  items: [
    itemDePedido({ quantity: 2, notes: 'alérgico al maní' }),
    itemDePedido({ id: 102, name: 'Chicha morada', modifiers: [{ group: 'Tamaño', option: 'Jarra', price: '12.00' }] }),
  ],
})
const LISTO = pedido({ id: 6, number: 13, status: 'ready', type: 'takeaway', table_label: null, customer_name: 'Luis' })
const NOTAS = '/insights/order-notes'

function abrir(permisos = PERMISOS_ENCARGADO, activos = [EN_COCINA, LISTO]) {
  const api = servidor()
    .on('get', '/orders/active', activos)
    .on('get', NOTAS, { items: [notaConAlergia()] })
    .on('post', '/orders/5/ready', pedido({ status: 'ready' }))
  entrarComo(permisos)
  return { api, ...montar(<KitchenView />, { path: '/cocina' }) }
}

describe('KitchenView', () => {
  it('separa lo que falta preparar de lo que espera salir, sin precios', async () => {
    abrir()
    const tarjeta = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(screen.getByRole('heading', { name: 'Por preparar (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Listos para servir (1)' })).toBeInTheDocument()
    expect(within(tarjeta).getByText('Mesa 3')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Jarra')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Mesa de cumpleaños')).toBeInTheDocument()
    expect(within(tarjeta).queryByText(/S\//u)).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Pedido 13' })).toHaveTextContent('Para llevar · Luis')
  })

  it('con el panel, la alergia de una nota se marca en la tarjeta', async () => {
    const { api } = abrir()
    const tarjeta = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(await within(tarjeta).findByText('Con alergia')).toBeInTheDocument()
    expect(api.llamadas('get', NOTAS)[0]?.params).toEqual({ order_ids: [5, 6] })
  })

  it('quien no ve el panel no pregunta por las alergias', async () => {
    const { api } = abrir(PERMISOS_MESERO)
    const tarjeta = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(within(tarjeta).getByText('alérgico al maní')).toBeInTheDocument()
    expect(within(tarjeta).queryByText('Con alergia')).not.toBeInTheDocument()
    expect(api.llamadas('get', NOTAS)).toHaveLength(0)
  })

  it('el encargado marca un pedido listo; el mesero solo mira', async () => {
    const { api, user } = abrir()
    const tarjeta = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(within(screen.getByRole('article', { name: 'Pedido 13' })).queryByRole('button', { name: 'Listo' })).not.toBeInTheDocument()
    await user.click(within(tarjeta).getByRole('button', { name: 'Listo' }))
    expect(await screen.findByText('Pedido #12 listo.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/5/ready')).toHaveLength(1)
  })

  it('un mesero no tiene el botón de listo', async () => {
    abrir(PERMISOS_MESERO)
    const tarjeta = await screen.findByRole('article', { name: 'Pedido 12' })
    expect(within(tarjeta).queryByRole('button', { name: 'Listo' })).not.toBeInTheDocument()
  })

  it('sin pedidos lo dice en cada columna', async () => {
    abrir(PERMISOS_MESERO, [])
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
