import { afterEach, describe, expect, it } from '@jest/globals'
import { act, screen } from '@testing-library/react'

import { pedido } from '#jest/fixtures/pedidos'
import { entrarComo, montar, RespuestaDeError, servidor, sinRed } from '#jest/harness'
import type { OpenOrderRequest } from '../../../api/types'
import { enqueueOrder, queuedOrders, removeQueued } from '../../../store/offlineQueue'
import OfflineOrdersBanner from './OfflineOrdersBanner'

const DUENA = { userId: 7, restaurantId: 1 }
const PEDIDOS = '/orders'
const ENVIAR = '/orders/5/send'
const ENVIADO = 'Mesa 3: pedido #12 enviado a cocina.'

function encolar(label: string, id: string, duena = DUENA) {
  const request: OpenOrderRequest = {
    type: 'dine_in',
    table_id: 3,
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_reference: '',
    notes: '',
    items: [{ menu_item_id: 11, quantity: 1, notes: '', modifiers: [] }],
    client_request_id: id,
  }
  enqueueOrder({ ...duena, request, label, queuedAt: '2026-09-26T17:00:00Z' })
}

function abrir(respuestaAlAbrir: unknown = pedido({ status: 'open' })) {
  const api = servidor().on('post', PEDIDOS, respuestaAlAbrir).on('post', ENVIAR, pedido())
  entrarComo()
  return { api, ...montar(<OfflineOrdersBanner />) }
}

afterEach(() => {
  for (const duena of [DUENA, { userId: 99, restaurantId: 1 }]) {
    for (const enCola of queuedOrders(duena)) {
      removeQueued(enCola.request.client_request_id ?? '')
    }
  }
})

describe('pedidos que esperan señal', () => {
  it('sin señal se quedan en la cola y el aviso los nombra', async () => {
    encolar('Mesa 3', 'a')
    encolar('Delivery · Ana', 'b')
    const { api } = abrir(sinRed)
    expect(await screen.findByText(/2 pedidos esperan señal: Mesa 3, Delivery · Ana\./u)).toBeInTheDocument()
    expect(api.llamadas('post', PEDIDOS)).toHaveLength(1)
    expect(queuedOrders(DUENA)).toHaveLength(2)
  })

  it('al volver la conexión se envían con su id y el aviso desaparece', async () => {
    encolar('Mesa 3', 'a')
    const { api } = abrir()
    expect(await screen.findByText(ENVIADO)).toBeInTheDocument()
    expect(api.llamadas('post', PEDIDOS)[0]?.body).toMatchObject({ client_request_id: 'a' })
    expect(api.llamadas('post', ENVIAR)).toHaveLength(1)
    expect(screen.queryByText(/espera señal/u)).not.toBeInTheDocument()
  })

  it('si ya estaba en cocina (409), cuenta como enviado', async () => {
    encolar('Mesa 3', 'a')
    const { api } = abrir()
    api.on('post', ENVIAR, new RespuestaDeError(409, 'El pedido ya está en cocina.'))
    expect(await screen.findByText(ENVIADO)).toBeInTheDocument()
    expect(queuedOrders(DUENA)).toHaveLength(0)
  })

  it('un rechazo de verdad se avisa y sale de la cola', async () => {
    encolar('Mesa 3', 'a')
    abrir(new RespuestaDeError(422, 'El lomo se agotó.'))
    expect(await screen.findByText('Mesa 3: El lomo se agotó.')).toBeInTheDocument()
    expect(queuedOrders(DUENA)).toHaveLength(0)
  })

  it('«Reintentar» y el evento de conexión vuelven a enviar', async () => {
    encolar('Mesa 3', 'a')
    const { api, user } = abrir(sinRed)
    await screen.findByText(/1 pedido espera señal/u)
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(api.llamadas('post', PEDIDOS)).toHaveLength(2)

    api.on('post', PEDIDOS, pedido({ status: 'open' }))
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(await screen.findByText(ENVIADO)).toBeInTheDocument()
  })

  it('los pedidos de otra cuenta del mismo celular no se ven ni se envían', async () => {
    encolar('Mesa 8', 'z', { userId: 99, restaurantId: 1 })
    const { api } = abrir()
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.queryByText(/espera señal/u)).not.toBeInTheDocument()
    expect(api.llamadas('post', PEDIDOS)).toHaveLength(0)
    expect(queuedOrders({ userId: 99, restaurantId: 1 })).toHaveLength(1)
  })
})
