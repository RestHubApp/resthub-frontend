import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen } from '@testing-library/react'

import { carta, mesa, pedido, resumenActivo, ultimoCuerpo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, servidor } from '#jest/harness'
import type { OpenOrderRequest } from '../../api/types'
import NewOrderView from './NewOrderView'
import { useDraftActions } from './taking/useOrderDraft'

const RUTA = '/pedidos/nuevo'
const PEDIDOS = '/orders'

function abrir(query: string, mesas = [mesa()]) {
  const api = servidor()
    .on('get', '/tables', mesas)
    .on('get', '/menu', carta())
    .on('post', PEDIDOS, pedido({ status: 'open' }))
    .on('post', '/orders/5/send', pedido())
  entrarComo()
  return { api, ...montar(<NewOrderView />, { path: RUTA, en: `${RUTA}?${query}` }) }
}

async function enviarUnLomo(montaje: ReturnType<typeof abrir>) {
  await montaje.user.click(await screen.findByRole('button', { name: /Lomo saltado/u }))
  await montaje.user.click(screen.getByRole('button', { name: /enviar a cocina/i }))
  await screen.findByText('Pedido #12 enviado a cocina.')
  return ultimoCuerpo(montaje.api.llamadas('post', PEDIDOS)) as OpenOrderRequest
}

afterEach(() => {
  const { result } = renderHook(() => useDraftActions())
  act(() => {
    for (const clave of ['llevar', 'delivery', 'mesa-3', 'mesa-9']) {
      result.current.clear(clave)
    }
  })
})

describe('NewOrderView', () => {
  it('un delivery lleva el cliente de la libreta y sus datos de entrega', async () => {
    const montaje = abrir('tipo=delivery&cliente=Ana&clienteId=40&telefono=987654321&direccion=Av.%20Larco%20123&referencia=Parque')
    expect(await screen.findByRole('heading', { name: 'Delivery · Ana', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Nuevo delivery a Av. Larco 123. Toca los platos que pide el cliente.')).toBeInTheDocument()

    expect(await enviarUnLomo(montaje)).toMatchObject({
      type: 'delivery',
      customer_name: 'Ana',
      customer_id: 40,
      customer_phone: '987654321',
      delivery_address: 'Av. Larco 123',
      delivery_reference: 'Parque',
    })
  })

  it('para llevar sin nombre ni cliente de la libreta', async () => {
    const montaje = abrir('tipo=llevar&clienteId=abc')
    expect(await screen.findByRole('heading', { name: 'Para llevar', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/pedidos?vista=llevar')

    expect(await enviarUnLomo(montaje)).toMatchObject({ type: 'takeaway', customer_name: '', customer_id: null, delivery_address: '' })
  })

  it('una mesa que no existe o está desactivada no deja tomar el pedido', async () => {
    abrir('mesa=9')
    expect(await screen.findByText('Esa mesa no existe o está desactivada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a las mesas' })).toHaveAttribute('href', '/pedidos')
  })

  it('si otro mesero ocupó la mesa, lo avisa con el enlace a su pedido', async () => {
    abrir('mesa=3', [mesa({ status: 'occupied', active_order: resumenActivo({ id: 8, number: 30 }) })])
    expect(await screen.findByText(/Esta mesa ya tiene el pedido #30\./u)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el pedido' })).toHaveAttribute('href', '/pedidos/8')
  })
})
