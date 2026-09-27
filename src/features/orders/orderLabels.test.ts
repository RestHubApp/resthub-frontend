import { describe, expect, it } from '@jest/globals'

import { notaConAlergia, pedido } from '#jest/fixtures/pedidos'
import { nextStepFor, stepDoneMessage } from './nextStep'
import { allergyIn } from './noteFlags'
import { deliveryLines, dishCount, isActive, orderPlace, STATUS_LABELS, STATUS_OPTIONS } from './orderLabels'

const DIRECCION = 'Av. Larco 123'
const TELEFONO = 'Tel.: 987654321'
const DELIVERY = { type: 'delivery', customer_phone: '987654321', delivery_address: DIRECCION, delivery_reference: '' } as const

describe('orderPlace', () => {
  it('una mesa numerada se lee «Mesa 3» y una con nombre, tal cual', () => {
    expect(orderPlace({ type: 'dine_in', table_label: '3', customer_name: '' })).toBe('Mesa 3')
    expect(orderPlace({ type: 'dine_in', table_label: 'Terraza', customer_name: '' })).toBe('Terraza')
    expect(orderPlace({ type: 'dine_in', table_label: null, customer_name: '' })).toBe('Mesa')
  })

  it('para llevar y delivery llevan el nombre del cliente si lo hay', () => {
    expect(orderPlace({ type: 'takeaway', table_label: null, customer_name: '' })).toBe('Para llevar')
    expect(orderPlace({ type: 'takeaway', table_label: null, customer_name: 'Ana' })).toBe('Para llevar · Ana')
    expect(orderPlace({ type: 'delivery', table_label: null, customer_name: 'Ana' })).toBe('Delivery · Ana')
  })
})

describe('deliveryLines', () => {
  it('lista dirección, referencia y teléfono sin los vacíos', () => {
    expect(deliveryLines(DELIVERY)).toEqual([DIRECCION, TELEFONO])
    expect(deliveryLines({ ...DELIVERY, delivery_reference: 'Frente al parque' })).toEqual([
      DIRECCION,
      'Ref.: Frente al parque',
      TELEFONO,
    ])
  })

  it('un pedido que no es delivery no tiene datos de entrega', () => {
    expect(deliveryLines({ ...DELIVERY, type: 'takeaway' })).toEqual([])
  })
})

describe('estados del pedido', () => {
  it('solo pagado y cancelado dejan de estar activos', () => {
    expect(['open', 'in_kitchen', 'ready', 'served'].every((estado) => isActive(estado as 'open'))).toBe(true)
    expect(isActive('paid')).toBe(false)
    expect(isActive('cancelled')).toBe(false)
  })

  it('las opciones del filtro siguen el ciclo y usan el mismo nombre que la insignia', () => {
    expect(STATUS_OPTIONS.map((opcion) => opcion.value)).toEqual(['open', 'in_kitchen', 'ready', 'served', 'paid', 'cancelled'])
    expect(STATUS_OPTIONS.find((opcion) => opcion.value === 'served')?.label).toBe(STATUS_LABELS.served)
  })

  it('cuenta los platos en singular o plural', () => {
    expect(dishCount(1)).toBe('1 plato')
    expect(dishCount(0)).toBe('0 platos')
    expect(dishCount(3)).toBe('3 platos')
  })
})

describe('nextStepFor', () => {
  it('cada estado activo tiene su paso y el permiso que lo exige', () => {
    expect(nextStepFor('open')).toMatchObject({ action: 'send', permission: 'orders.take', label: 'Enviar a cocina' })
    expect(nextStepFor('in_kitchen')).toMatchObject({ action: 'ready', permission: 'orders.manage' })
    expect(nextStepFor('ready')).toMatchObject({ action: 'served', permission: 'orders.take' })
    expect(nextStepFor('served')).toMatchObject({ action: 'charge', permission: 'orders.charge' })
  })

  it('un pedido pagado o cancelado ya no tiene paso', () => {
    expect(nextStepFor('paid')).toBeUndefined()
    expect(nextStepFor('cancelled')).toBeUndefined()
  })
})

describe('stepDoneMessage', () => {
  it('el aviso dice el estado en que quedó el pedido', () => {
    expect(stepDoneMessage(pedido({ status: 'in_kitchen' }))).toBe('Pedido #12 enviado a cocina.')
    expect(stepDoneMessage(pedido({ status: 'ready' }))).toBe('Pedido #12 listo.')
    expect(stepDoneMessage(pedido({ status: 'served' }))).toBe('Pedido #12 servido, por cobrar.')
    expect(stepDoneMessage(pedido({ status: 'paid' }))).toBe('Pedido #12 actualizado.')
  })
})

describe('allergyIn', () => {
  it('encuentra la nota de un plato que menciona una alergia', () => {
    const alergia = notaConAlergia()
    const flagFor = (orderId: number, itemId: number | null) => (orderId === 5 && itemId === 101 ? alergia : undefined)
    expect(allergyIn(pedido(), flagFor)).toBe(alergia)
  })

  it('también mira la nota del pedido, e ignora las que no son alergia', () => {
    const delPedido = notaConAlergia({ order_item_id: null, scope: 'order' })
    const preferencia = notaConAlergia({ mentions_allergy: false })
    expect(allergyIn(pedido(), (_, itemId) => (itemId === null ? delPedido : preferencia))).toBe(delPedido)
    expect(allergyIn(pedido(), () => preferencia)).toBeUndefined()
  })
})
