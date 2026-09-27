import { describe, expect, it } from '@jest/globals'

import { fetchOrderMenu } from '../orders'
import { fetchTables } from '../tables'
import type { OrderMenu, TableState } from '../types'
import {
  API_PREFIX,
  arrayContaining,
  bearer,
  boolean,
  connectTo,
  eachLike,
  integer,
  isoDatetime,
  like,
  money,
  newPact,
  nullValue,
  oneOf,
  STATE,
  string,
} from './pactHarness'

const pact = newPact()

function tableShape(status: 'free' | 'occupied') {
  return {
    id: integer(1),
    label: string('1'),
    position: integer(0),
    is_active: boolean(true),
    created_at: isoDatetime(),
    status: oneOf(['free', 'occupied'], status),
    status_label: string(status === 'free' ? 'Libre' : 'Ocupada'),
  }
}

function activeOrderShape() {
  return {
    id: integer(1),
    number: integer(1),
    status: string('open'),
    status_label: string('Abierto'),
    total: money('56.00'),
    balance: money('56.00'),
    item_count: integer(2),
    waiter_id: integer(1),
    waiter_name: string('Encargado Demo'),
    created_at: isoDatetime(),
    updated_at: isoDatetime(),
    status_changed_at: isoDatetime(),
  }
}

function pricesOf(menu: OrderMenu): string[] {
  return menu.categories.flatMap((category) => category.items.map((item) => item.price))
}

function activeBalances(tables: readonly TableState[]): (string | null)[] {
  return tables.map((table) => table.active_order?.balance ?? null)
}

describe('Contrato: carta y salón', () => {
  it('lee la carta con sus categorías y platos', async () => {
    await pact
      .addInteraction()
      .given(STATE.ownerSession)
      .uponReceiving('la lectura de la carta')
      .withRequest('GET', `${API_PREFIX}/menu`, (req) => req.headers(bearer()))
      .willRespondWith(200, (res) =>
        res.jsonBody({
          categories: eachLike({
            id: integer(1),
            name: string('Entradas'),
            position: integer(0),
            is_active: boolean(true),
            items: eachLike({
              id: integer(1),
              category_id: integer(1),
              name: string('Causa limeña'),
              description: string('Papa amarilla, pollo y palta.'),
              price: money('18.00'),
              is_available: boolean(true),
              is_active: boolean(true),
              out_of_stock: boolean(false),
              position: integer(0),
              modifier_groups: [],
            }),
          }),
        }),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const menu = await fetchOrderMenu()
        expect(pricesOf(menu)).toContain('18.00')
      })
  })

  it('lee las mesas con su estado y el resumen del pedido en curso', async () => {
    await pact
      .addInteraction()
      .given(STATE.openOrder)
      .uponReceiving('la lectura de las mesas del salón')
      .withRequest('GET', `${API_PREFIX}/tables`, (req) => req.headers(bearer()))
      .willRespondWith(200, (res) =>
        res.jsonBody(
          // Una mesa ocupada trae el resumen de su pedido y una libre, `null`:
          // el contrato pide que la lista tenga de las dos formas.
          arrayContaining(
            { ...tableShape('occupied'), active_order: like(activeOrderShape()) },
            { ...tableShape('free'), active_order: nullValue() },
          ),
        ),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const tables = await fetchTables()
        expect(activeBalances(tables)).toEqual(['56.00', null])
      })
  })
})
