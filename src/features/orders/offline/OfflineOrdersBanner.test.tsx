import { afterEach, describe, expect, it } from '@jest/globals'
import { act, screen } from '@testing-library/react'

import { order } from '#jest/fixtures/pedidos'
import { signInAs, handleMount, ErrorResponse, server, withoutNetwork } from '#jest/harness'
import type { OpenOrderRequest } from '@/api/types'
import { enqueueOrder, queuedOrders, removeQueued } from '@/store/offlineQueue'
import { OfflineOrdersBanner } from './OfflineOrdersBanner'

const OWNER = { userId: 7, restaurantId: 1 }
const ORDERS = '/orders'
const SEND = '/orders/5/send'
const SENT = 'Mesa 3: pedido #12 enviado a cocina.'

function enqueue(label: string, id: string, owner = OWNER) {
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
  enqueueOrder({ ...owner, request, label, queuedAt: '2026-09-26T17:00:00Z' })
}

function open(responseOnOpen: unknown = order({ status: 'open' })) {
  const api = server().on('post', ORDERS, responseOnOpen).on('post', SEND, order())
  signInAs()
  return { api, ...handleMount(<OfflineOrdersBanner />) }
}

afterEach(() => {
  for (const owner of [OWNER, { userId: 99, restaurantId: 1 }]) {
    for (const inQueue of queuedOrders(owner)) {
      removeQueued(inQueue.request.client_request_id ?? '')
    }
  }
})

describe('pedidos que esperan señal', () => {
  it('sin señal se quedan en la cola y el aviso los nombra', async () => {
    enqueue('Mesa 3', 'a')
    enqueue('Delivery · Ana', 'b')
    const { api } = open(withoutNetwork)
    expect(await screen.findByText(/2 pedidos esperan señal: Mesa 3, Delivery · Ana\./u)).toBeInTheDocument()
    expect(api.calls('post', ORDERS)).toHaveLength(1)
    expect(queuedOrders(OWNER)).toHaveLength(2)
  })

  it('al volver la conexión se envían con su id y el aviso desaparece', async () => {
    enqueue('Mesa 3', 'a')
    const { api } = open()
    expect(await screen.findByText(SENT)).toBeInTheDocument()
    expect(api.calls('post', ORDERS)[0]?.body).toMatchObject({ client_request_id: 'a' })
    expect(api.calls('post', SEND)).toHaveLength(1)
    expect(screen.queryByText(/espera señal/u)).not.toBeInTheDocument()
  })

  it('si ya estaba en cocina (409), cuenta como enviado', async () => {
    enqueue('Mesa 3', 'a')
    const { api } = open()
    api.on('post', SEND, new ErrorResponse(409, 'El pedido ya está en cocina.'))
    expect(await screen.findByText(SENT)).toBeInTheDocument()
    expect(queuedOrders(OWNER)).toHaveLength(0)
  })

  it('un rechazo de verdad se avisa y sale de la cola', async () => {
    enqueue('Mesa 3', 'a')
    open(new ErrorResponse(422, 'El lomo se agotó.'))
    expect(await screen.findByText('Mesa 3: El lomo se agotó.')).toBeInTheDocument()
    expect(queuedOrders(OWNER)).toHaveLength(0)
  })

  it('«Reintentar» y el evento de conexión vuelven a enviar', async () => {
    enqueue('Mesa 3', 'a')
    const { api, user } = open(withoutNetwork)
    await screen.findByText(/1 pedido espera señal/u)
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(api.calls('post', ORDERS)).toHaveLength(2)

    api.on('post', ORDERS, order({ status: 'open' }))
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(await screen.findByText(SENT)).toBeInTheDocument()
  })

  it('los pedidos de otra cuenta del mismo celular no se ven ni se envían', async () => {
    enqueue('Mesa 8', 'z', { userId: 99, restaurantId: 1 })
    const { api } = open()
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.queryByText(/espera señal/u)).not.toBeInTheDocument()
    expect(api.calls('post', ORDERS)).toHaveLength(0)
    expect(queuedOrders({ userId: 99, restaurantId: 1 })).toHaveLength(1)
  })
})
