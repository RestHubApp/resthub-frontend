import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen } from '@testing-library/react'

import { order } from '#jest/fixtures/orders'
import { mountScreen, server, signInAs, withoutNetwork } from '#jest/harness'
import type { OpenOrderRequest } from '@/api/types'
import { reportLiveStatus } from '@/store/liveStatus'
import { enqueueOrder, queuedOrders, removeQueued } from '@/store/offlineQueue'
import { ConnectionButton } from './ConnectionButton'

const OWNER = { userId: 7, restaurantId: 1 }
const CHANNEL = Symbol('pantalla')
const ONLINE = 'Conexión en vivo: en línea'
const RETRY = 'Reintentar ahora'
const ORDERS = '/orders'
const STATE = 'data-connection'

function enqueue(label: string, id: string) {
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
  enqueueOrder({ ...OWNER, request, label, queuedAt: '2026-09-26T17:00:00Z' })
}

function setNetwork(isOnline: boolean) {
  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(isOnline)
  window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'))
}

function open() {
  signInAs()
  return mountScreen(<ConnectionButton />)
}

afterEach(() => {
  jest.restoreAllMocks()
  reportLiveStatus(CHANNEL, null)
  for (const inQueue of queuedOrders(OWNER)) {
    removeQueued(inQueue.request.client_request_id ?? '')
  }
})

describe('ConnectionButton', () => {
  it('en línea y con el canal en vivo conectado, se anuncia «en línea» (punto verde)', () => {
    reportLiveStatus(CHANNEL, 'live')
    open()

    const button = screen.getByRole('button', { name: ONLINE })
    expect(button).toHaveAttribute('title', ONLINE)
    expect(button).toHaveAttribute(STATE, 'online')
  })

  it('con el canal cortado se anuncia «reconectando» (ámbar), y vuelve al reconectar', () => {
    reportLiveStatus(CHANNEL, 'offline')
    open()

    const button = screen.getByRole('button', { name: 'Conexión en vivo: reconectando' })
    expect(button).toHaveAttribute(STATE, 'reconnecting')

    act(() => {
      reportLiveStatus(CHANNEL, 'live')
    })
    expect(screen.getByRole('button', { name: ONLINE })).toBeInTheDocument()
  })

  it('sin red se anuncia «sin conexión» (rojo)', () => {
    setNetwork(false)
    open()

    const button = screen.getByRole('button', { name: 'Conexión en vivo: sin conexión' })
    expect(button).toHaveAttribute(STATE, 'offline')

    act(() => {
      setNetwork(true)
    })
    expect(screen.getByRole('button', { name: ONLINE })).toBeInTheDocument()
  })

  it('cuenta los pedidos que esperan señal en el nombre y en el globito', () => {
    setNetwork(false)
    enqueue('Mesa 3', 'a')
    enqueue('Delivery · Ana', 'b')
    open()

    const button = screen.getByRole('button', { name: 'Conexión en vivo: sin conexión. 2 pedidos sin enviar' })
    expect(button).toHaveTextContent('2')
  })

  it('el panel explica el estado y «Reintentar ahora» envía la cola', async () => {
    enqueue('Mesa 3', 'a')
    const api = server().on('post', ORDERS, order({ status: 'open' })).on('post', '/orders/5/send', order())
    const { user } = open()

    await user.click(screen.getByRole('button', { name: /^Conexión en vivo: en línea\. 1 pedido sin enviar$/u }))
    // El panel se baja al abrirlo.
    expect(await screen.findByRole('status')).toHaveTextContent('En línea')
    expect(screen.getByText('1 pedido sin enviar: Mesa 3.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: RETRY }))
    expect(await screen.findByText('Mesa 3: pedido #12 enviado a cocina.')).toBeInTheDocument()
    expect(api.calls('post', ORDERS)[0]?.body).toMatchObject({ client_request_id: 'a' })
    expect(queuedOrders(OWNER)).toHaveLength(0)
    expect(screen.queryByRole('button', { name: RETRY })).not.toBeInTheDocument()
  })

  it('si sigue sin señal, el pedido se queda en la cola', async () => {
    enqueue('Mesa 3', 'a')
    const api = server().on('post', ORDERS, withoutNetwork)
    const { user } = open()

    await user.click(screen.getByRole('button', { name: /1 pedido sin enviar/u }))
    await user.click(await screen.findByRole('button', { name: RETRY }))

    expect(await screen.findByRole('button', { name: RETRY })).toBeEnabled()
    expect(api.calls('post', ORDERS)).toHaveLength(1)
    expect(queuedOrders(OWNER)).toHaveLength(1)
  })
})
