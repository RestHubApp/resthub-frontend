import { describe, expect, it } from 'vitest'

import type { OrderItemResponse, OrderResponse } from '../../../api/types'
import { chargeCents, equalPartCents, itemsCents, unpaidItems } from './chargeMath'

function item(id: number, subtotal: string, extra: Partial<OrderItemResponse> = {}): OrderItemResponse {
  return {
    id,
    menu_item_id: id,
    name: `Plato ${String(id)}`,
    unit_price: subtotal,
    quantity: 1,
    notes: '',
    modifiers: [],
    subtotal,
    is_courtesy: false,
    courtesy_reason: '',
    is_paid: false,
    created_at: '2026-09-25T20:00:00Z',
    ...extra,
  }
}

// Solo los campos que leen las cuentas del cobro.
function order(items: OrderItemResponse[], balance: string, discountPercent = '0'): OrderResponse {
  return { items, balance, discount_percent: discountPercent } as OrderResponse
}

describe('equalPartCents', () => {
  it('reparte hacia abajo y deja el redondeo al último', () => {
    expect(equalPartCents(10_000, 3)).toBe(3333)
    expect(equalPartCents(10_000 - 3333 * 2, 1)).toBe(3334)
  })

  it('con una persona o menos cobra lo que falta', () => {
    expect(equalPartCents(4550, 1)).toBe(4550)
    expect(equalPartCents(4550, 0)).toBe(4550)
  })
})

describe('itemsCents', () => {
  const platos = [item(1, '20.00'), item(2, '15.50'), item(3, '10.00', { is_courtesy: true })]

  it('suma los platos elegidos sin las cortesías', () => {
    const pedido = order(platos, '35.50')
    expect(itemsCents(pedido, [2, 3])).toBe(1550)
  })

  it('aplica el descuento del pedido con medio céntimo hacia arriba', () => {
    const pedido = order(platos, '31.95', '10')
    // 15.50 − 10 % = 13.95
    expect(itemsCents(pedido, [2])).toBe(1395)
  })

  it('si son todos los que faltan, cobra el saldo exacto', () => {
    const pedido = order(platos, '31.95', '10')
    expect(itemsCents(pedido, [1, 2, 3])).toBe(3195)
  })

  it('ignora los platos ya pagados', () => {
    const pedido = order([item(1, '20.00', { is_paid: true }), item(2, '15.50')], '15.50')
    expect(unpaidItems(pedido).map((plato) => plato.id)).toEqual([2])
    expect(itemsCents(pedido, [1])).toBe(0)
  })
})

describe('chargeCents', () => {
  const pedido = order([item(1, '30.00'), item(2, '12.00')], '42.00')

  it('según el modo: todo, partes iguales o por platos', () => {
    expect(chargeCents(pedido, 'all', 1, [])).toBe(4200)
    expect(chargeCents(pedido, 'equal', 2, [])).toBe(2100)
    expect(chargeCents(pedido, 'items', 1, [2])).toBe(1200)
  })
})
