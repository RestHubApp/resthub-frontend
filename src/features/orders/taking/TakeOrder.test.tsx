import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen, within } from '@testing-library/react'

import { handleMenu, table, order, lastBody } from '#jest/fixtures/orders'
import { signInAs, handleMount, handleFirst, ErrorResponse, server, withoutNetwork } from '#jest/harness'
import type { OpenOrderRequest } from '@/api/types'
import { ownerOf, queuedOrders, removeQueued } from '@/store/offlineQueue'
import { useSession } from '@/store/session'
import { NewOrderView } from '@/features/orders/NewOrderView'
import { useDraftActions } from './useOrderDraft'

const ORDERS = '/orders'
const SEND = '/orders/5/send'
const SEND_TO_KITCHEN = { name: /enviar a cocina/i }
const OWNER = { userId: 7, restaurantId: 1 }
const LOMO = 'Lomo saltado'

function takeOrderInTable() {
  const api = server()
    .on('get', '/tables', [table()])
    .on('get', '/menu', handleMenu())
    .on('post', ORDERS, order({ status: 'open' }))
    .on('post', SEND, order())
  signInAs()
  return { api, ...handleMount(<NewOrderView />, { path: '/pedidos/nuevo', en: '/pedidos/nuevo?mesa=3' }) }
}

async function select(user: ReturnType<typeof takeOrderInTable>['user'], name: string) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- el texto lo fija la prueba; se busca por coincidencia parcial del nombre accesible
  await user.click(await screen.findByRole('button', { name: new RegExp(name, 'u') }))
}

async function send(user: ReturnType<typeof takeOrderInTable>['user']) {
  // El botón de la barra; el del resumen solo está con el resumen abierto.
  await user.click(handleFirst(screen.getAllByRole('button', SEND_TO_KITCHEN)))
}

function currentRoute() {
  return screen.findByRole('status', { name: 'Ruta actual' })
}

afterEach(() => {
  const { result } = renderHook(() => useDraftActions())
  act(() => {
    result.current.clear('mesa-3')
  })
  // La sesión ya la cerró el arnés: la cola se vacía con la dueña fija de las pruebas.
  for (const inQueue of queuedOrders(OWNER)) {
    removeQueued(inQueue.request.client_request_id ?? '')
  }
})

describe('tomar un pedido en una mesa', () => {
  it('mesa, dos platos y «Enviar a cocina»: abre el pedido, lo envía y vuelve al salón', async () => {
    const { api, user } = takeOrderInTable()
    expect(await screen.findByRole('heading', { name: 'Mesa 3', level: 1 })).toBeInTheDocument()

    await select(user, LOMO)
    await select(user, 'Ají de gallina')
    expect(screen.getByText('2 platos · Ver y anotar')).toBeInTheDocument()
    await send(user)

    expect(await screen.findByText('Pedido #12 enviado a cocina.')).toBeInTheDocument()
    const body = lastBody(api.calls('post', ORDERS)) as OpenOrderRequest
    expect(body).toMatchObject({ type: 'dine_in', table_id: 3, customer_name: '' })
    expect(body.items?.map((item) => item.menu_item_id)).toEqual([11, 12])
    expect(body.client_request_id).toEqual(expect.any(String))
    expect(api.calls('post', SEND)).toHaveLength(1)
    expect(await currentRoute()).toHaveTextContent('/pedidos')
  })

  it('en el resumen se anota para la cocina y se ajusta la cantidad', async () => {
    const { api, user } = takeOrderInTable()
    await select(user, LOMO)
    await user.click(screen.getByRole('button', { name: /ver y anotar/i }))

    const summary = await screen.findByRole('dialog', { name: 'Resumen · Mesa 3' })
    await user.type(within(summary).getByLabelText('Nota para cocina'), 'sin cebolla')
    await user.click(within(summary).getByRole('button', { name: 'Uno más de Lomo saltado' }))
    expect(within(summary).getByText('2 platos')).toBeInTheDocument()
    await user.click(within(summary).getByRole('button', SEND_TO_KITCHEN))

    await screen.findByText('Pedido #12 enviado a cocina.')
    const body = lastBody(api.calls('post', ORDERS)) as OpenOrderRequest
    expect(body.items).toEqual([{ menu_item_id: 11, quantity: 2, notes: 'sin cebolla', modifiers: [] }])
  })

  it('si la cocina no lo recibe, el pedido queda abierto y lleva a su detalle', async () => {
    const { api, user } = takeOrderInTable()
    api.on('post', SEND, new ErrorResponse(500, 'La cocina no respondió'))
    await select(user, LOMO)
    await send(user)

    expect(await screen.findByText('El pedido #12 quedó abierto sin enviar: La cocina no respondió')).toBeInTheDocument()
    expect(await currentRoute()).toHaveTextContent('/pedidos/5')
  })

  it('sin señal, el pedido queda guardado en el celular para enviarse solo', async () => {
    const { api, user } = takeOrderInTable()
    api.on('post', ORDERS, withoutNetwork)
    await select(user, LOMO)
    await send(user)

    expect(await screen.findByText('Sin señal: el pedido de Mesa 3 quedó guardado y se enviará solo.')).toBeInTheDocument()
    const inQueue = queuedOrders(ownerOf(useSession.getState().account))
    expect(inQueue.map((item) => [item.label, item.request.table_id])).toEqual([['Mesa 3', 3]])
    expect(api.calls('post', SEND)).toHaveLength(0)
  })

  it('un rechazo del servidor se avisa y el borrador sigue ahí para corregirlo', async () => {
    const { api, user } = takeOrderInTable()
    api.on('post', ORDERS, new ErrorResponse(409, 'La mesa ya tiene un pedido abierto.'))
    await select(user, LOMO)
    await send(user)

    expect(await screen.findByText('La mesa ya tiene un pedido abierto.')).toBeInTheDocument()
    expect(screen.getByText('1 plato · Ver y anotar')).toBeInTheDocument()
    expect(queuedOrders(ownerOf(useSession.getState().account))).toHaveLength(0)
  })

  it('sin platos no se puede enviar', async () => {
    takeOrderInTable()
    expect(await screen.findByText('Toca un plato')).toBeInTheDocument()
    expect(screen.getByRole('button', SEND_TO_KITCHEN)).toBeDisabled()
  })
})
