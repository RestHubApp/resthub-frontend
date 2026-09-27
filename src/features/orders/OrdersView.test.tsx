import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mesa, pedido, resumenActivo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, PERMISOS_ENCARGADO, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import OrdersView from './OrdersView'

const SALON = [
  mesa(),
  mesa({ id: 4, label: '4', status: 'occupied', active_order: resumenActivo({ id: 8, number: 31 }) }),
  mesa({ id: 5, label: 'Terraza', status: 'occupied', active_order: resumenActivo({ id: 9, number: 32, status: 'ready' }) }),
]
const LLEVAR = pedido({ id: 20, number: 40, type: 'takeaway', table_id: null, table_label: null, customer_name: 'Ana' })

function abrir(en = '/pedidos', permisos = PERMISOS_MESERO) {
  const api = servidor()
    .on('get', '/tables', SALON)
    .on('get', '/orders/active', [pedido(), LLEVAR])
    .on('get', '/orders', { items: [pedido(), pedido({ id: 6, number: 13, status: 'paid' })], total: 2 })
  entrarComo(permisos)
  return { api, ...montar(<OrdersView />, { path: '/pedidos', en }) }
}

describe('el salón del mesero', () => {
  it('cuenta las mesas libres; la libre lleva a tomar pedido y la ocupada a su pedido', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: '1 de 3 mesas libres' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mesa 3\s*Libre/u })).toHaveAttribute('href', '/pedidos/nuevo?mesa=3')
    const ocupada = screen.getByRole('link', { name: /Mesa 4/u })
    expect(ocupada).toHaveAttribute('href', '/pedidos/8')
    expect(within(ocupada).getByText('En cocina')).toBeInTheDocument()
    expect(within(ocupada).getByText(/2 platos · Ana Torres/u)).toBeInTheDocument()
  })

  it('una mesa con el pedido listo avisa que falta servirlo', async () => {
    abrir()
    const lista = await screen.findByRole('link', { name: /Terraza/u })
    expect(within(lista).getByText('Falta servirlo')).toBeInTheDocument()
  })

  it('sin mesas, el encargado puede ir a crearlas y el mesero no', async () => {
    servidor().on('get', '/tables', [])
    entrarComo(PERMISOS_ENCARGADO)
    const { unmount } = montar(<OrdersView />, { path: '/pedidos' })
    expect(await screen.findByText('No hay mesas activas')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear mesas' })).toHaveAttribute('href', '/mesas')
    unmount()

    servidor().on('get', '/tables', [])
    entrarComo(PERMISOS_MESERO)
    montar(<OrdersView />, { path: '/pedidos' })
    expect(await screen.findByText('No hay mesas activas')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Crear mesas' })).not.toBeInTheDocument()
  })

  it('si las mesas no cargan, reintentar vuelve a pedirlas', async () => {
    const { api, user } = abrir()
    api.on('get', '/tables', new RespuestaDeError(503, 'Servidor ocupado'))
    expect(await screen.findByText('Servidor ocupado')).toBeInTheDocument()
    api.on('get', '/tables', SALON)
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: '1 de 3 mesas libres' })).toBeInTheDocument()
  })
})

describe('las otras pestañas', () => {
  it('«Llevar y delivery» muestra solo lo que no es de mesa y queda en la dirección', async () => {
    const { user, router } = abrir()
    await user.click(await screen.findByRole('tab', { name: 'Llevar y delivery' }))

    expect(await screen.findByRole('heading', { name: 'En curso (1)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /#40\s*Para llevar · Ana/u })).toHaveAttribute('href', '/pedidos/20')
    expect(router.state.location.search).toBe('?vista=llevar')
  })

  it('sin pedidos para llevar lo dice', async () => {
    const { api } = abrir('/pedidos?vista=llevar')
    api.on('get', '/orders/active', [pedido()])
    expect(await screen.findByText('No hay pedidos para llevar ni delivery en curso')).toBeInTheDocument()
  })

  it('«Mis pedidos» separa lo que sigue en curso de lo cerrado hoy, solo del mesero', async () => {
    const { api } = abrir('/pedidos?vista=mios')
    expect(await screen.findByRole('heading', { name: 'En curso (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cerrados hoy (1)' })).toBeInTheDocument()
    const params = api.llamadas('get', '/orders')[0]?.params ?? {}
    expect(params).toMatchObject({ waiter_id: 7, limit: 100 })
    expect(params.date_from).toBe(params.date_to)
  })

  it('sin pedidos del día invita a tomar el primero', async () => {
    const { api } = abrir('/pedidos?vista=mios')
    api.on('get', '/orders', { items: [], total: 0 })
    expect(await screen.findByText('Todavía no tomaste pedidos hoy')).toBeInTheDocument()
  })

  it('una vista desconocida en la dirección abre las mesas', async () => {
    abrir('/pedidos?vista=otra')
    expect(await screen.findByRole('tab', { name: 'Mesas', selected: true })).toBeInTheDocument()
  })
})
