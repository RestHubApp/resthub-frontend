import { describe, expect, it } from '@jest/globals'

import { errorStatus } from '../../services/api'
import { addOrderItems, fetchOrder, openOrder } from '../orders'
import type { OpenOrderRequest } from '../types'
import { orderItemShape, orderShape } from './orderShapes'
import {
  API_PREFIX,
  bearer,
  connectTo,
  eachLike,
  errorBody,
  fromProviderState,
  JSON_HEADERS,
  newPact,
  regex,
  rejectionOf,
  STATE,
  statePath,
} from './pactHarness'

const pact = newPact()
const EXAMPLE_TABLE = 3
const EXAMPLE_DISH = 7
const EXAMPLE_ORDER = 12
// Lo genera el celular al tomar el pedido. Si se reintenta con el mismo valor
// (volvió la señal, un doble toque), el servidor devuelve el pedido que ya abrió.
const CLIENT_REQUEST_ID = '5b0f8a8e-6c1d-4c38-9f0e-0c8d2f4b7a11'

describe('Contrato: pedidos', () => {
  it('abre un pedido de mesa con su identificador de cliente', async () => {
    const payload: OpenOrderRequest = {
      type: 'dine_in',
      table_id: EXAMPLE_TABLE,
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      delivery_reference: '',
      notes: '',
      client_request_id: CLIENT_REQUEST_ID,
      items: [{ menu_item_id: EXAMPLE_DISH, quantity: 2, notes: '', modifiers: [] }],
    }
    await pact
      .addInteraction()
      .given(STATE.freeTable)
      .uponReceiving('la apertura de un pedido de mesa con client_request_id')
      .withRequest('POST', `${API_PREFIX}/orders`, (req) =>
        req.headers({ ...bearer(), ...JSON_HEADERS }).jsonBody({
          ...payload,
          table_id: fromProviderState('${tableId}', EXAMPLE_TABLE),
          client_request_id: regex(/^[0-9a-f-]{8,64}$/u, CLIENT_REQUEST_ID),
          items: [{ ...payload.items?.[0], menu_item_id: fromProviderState('${menuItemId}', EXAMPLE_DISH) }],
        }),
      )
      .willRespondWith(201, (res) =>
        res.jsonBody(orderShape('open', { table_id: fromProviderState('${tableId}', EXAMPLE_TABLE) })),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const order = await openOrder(payload)
        expect(order.status).toBe('open')
        expect(order.table_id).toBe(EXAMPLE_TABLE)
      })
  })

  it('agrega platos a un pedido abierto', async () => {
    const items = [{ menu_item_id: EXAMPLE_DISH, quantity: 1, notes: 'sin cebolla', modifiers: [] }]
    await pact
      .addInteraction()
      .given(STATE.openOrder)
      .uponReceiving('el agregado de platos a un pedido abierto')
      .withRequest('POST', statePath('/orders/${orderId}/items', `/orders/${String(EXAMPLE_ORDER)}/items`), (req) =>
        req.headers({ ...bearer(), ...JSON_HEADERS }).jsonBody({
          items: [{ ...items[0], menu_item_id: fromProviderState('${menuItemId}', EXAMPLE_DISH) }],
        }),
      )
      .willRespondWith(200, (res) =>
        res.jsonBody(
          orderShape('open', {
            id: fromProviderState('${orderId}', EXAMPLE_ORDER),
            items: eachLike(orderItemShape(EXAMPLE_DISH), 2),
          }),
        ),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const order = await addOrderItems(EXAMPLE_ORDER, items)
        expect(order.id).toBe(EXAMPLE_ORDER)
        expect(order.items.length).toBeGreaterThanOrEqual(2)
      })
  })

  it('un pedido de otro restaurante responde 404, como uno que no existe', async () => {
    await pact
      .addInteraction()
      .given(STATE.foreignOrder)
      .uponReceiving('la lectura de un pedido de otro restaurante')
      .withRequest('GET', statePath('/orders/${orderId}', `/orders/${String(EXAMPLE_ORDER)}`), (req) =>
        req.headers(bearer()),
      )
      .willRespondWith(404, (res) => res.jsonBody(errorBody(`No existe el pedido ${String(EXAMPLE_ORDER)}.`)))
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const error = await rejectionOf(fetchOrder(EXAMPLE_ORDER))
        expect(errorStatus(error)).toBe(404)
      })
  })
})
