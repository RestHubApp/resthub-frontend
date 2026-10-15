import { describe, expect, it } from '@jest/globals'

import { payment } from '#jest/fixtures/charge'
import { orderItem, order } from '#jest/fixtures/orders'
import { canVoidItems, isNewItem, kitchenRounds, liveItems } from './kitchenRounds'

const FIRST = orderItem({ id: 1, kitchen_round: 1 })
const SECOND = orderItem({ id: 2, kitchen_round: 2 })
const THIRD = orderItem({ id: 3, kitchen_round: 3 })
const VOIDED = orderItem({ id: 4, kitchen_round: 1, voided_at: '2026-09-26T17:30:00Z', void_reason: 'Sin insumo' })

const ids = (items: readonly { id: number }[]) => items.map((item) => item.id)

describe('kitchenRounds', () => {
  it('un pedido que fue a cocina de una sola vez no se separa', () => {
    const rounds = kitchenRounds(order({ kitchen_round: 1, items: [FIRST, VOIDED] }))

    expect(rounds.added).toBeNull()
    expect(ids(rounds.sent)).toEqual([1, 4])
  })

  it('sin enviar todavía (ronda 0) tampoco', () => {
    const pending = orderItem({ id: 5, kitchen_round: 0 })
    expect(kitchenRounds(order({ status: 'open', kitchen_round: 0, items: [pending] })).added).toBeNull()
  })

  it('en la ronda 2, lo agregado va aparte y lo de la primera queda como ya enviado', () => {
    const rounds = kitchenRounds(order({ kitchen_round: 2, items: [FIRST, SECOND, VOIDED] }))

    expect(rounds.added?.round).toBe(2)
    expect(ids(rounds.added?.items ?? [])).toEqual([2])
    expect(ids(rounds.sent)).toEqual([1, 4])
  })

  it('en la ronda 3, solo lo de la 3 es nuevo; lo de la 2 ya se envió', () => {
    const current = order({ kitchen_round: 3, items: [FIRST, SECOND, THIRD] })

    expect(ids(kitchenRounds(current).added?.items ?? [])).toEqual([3])
    expect(ids(kitchenRounds(current).sent)).toEqual([1, 2])
    expect(isNewItem(current, SECOND)).toBe(false)
    expect(isNewItem(current, THIRD)).toBe(true)
  })

  it('una ronda vigente sin platos propios (se anularon o se juntaron) no deja un grupo vacío', () => {
    expect(kitchenRounds(order({ kitchen_round: 2, items: [FIRST] })).added).toBeNull()
  })
})

describe('anular platos', () => {
  it('los anulados no cuentan como platos vigentes', () => {
    expect(ids(liveItems(order({ items: [FIRST, VOIDED] })))).toEqual([1])
  })

  it('se puede en cocina, listo o servido, sin pagos', () => {
    expect(canVoidItems(order({ status: 'in_kitchen' }))).toBe(true)
    expect(canVoidItems(order({ status: 'ready' }))).toBe(true)
    expect(canVoidItems(order({ status: 'served' }))).toBe(true)
  })

  it('no en «abierto» (ahí se quita el plato), ni cerrado, ni con pagos', () => {
    expect(canVoidItems(order({ status: 'open' }))).toBe(false)
    expect(canVoidItems(order({ status: 'paid' }))).toBe(false)
    expect(canVoidItems(order({ status: 'cancelled' }))).toBe(false)
    expect(canVoidItems(order({ payments: [payment()] }))).toBe(false)
  })
})
