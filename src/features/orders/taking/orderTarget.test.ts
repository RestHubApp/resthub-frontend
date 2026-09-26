import { describe, expect, it } from 'vitest'

import { newOrderPath } from '../floor/takeawaySchema'
import { draftKey, openRequest } from './orderTarget'

const items = [{ menu_item_id: 1, quantity: 2, notes: '', modifiers: [] }]

describe('openRequest', () => {
  it('una mesa va como pedido en mesa, con el id que evita duplicados', () => {
    expect(openRequest({ kind: 'table', tableId: 4 }, items, 'abc')).toMatchObject({
      type: 'dine_in',
      table_id: 4,
      client_request_id: 'abc',
      delivery_address: '',
    })
  })

  it('con datos de entrega es un delivery', () => {
    const target = {
      kind: 'takeaway',
      customerName: 'Ana',
      customerId: 9,
      delivery: { phone: '987654321', address: 'Av. Larco 123', reference: 'Frente al parque' },
    } as const
    expect(openRequest(target, items, 'x')).toMatchObject({
      type: 'delivery',
      customer_name: 'Ana',
      customer_id: 9,
      customer_phone: '987654321',
      delivery_address: 'Av. Larco 123',
      delivery_reference: 'Frente al parque',
    })
    expect(draftKey(target)).toBe('delivery')
  })

  it('sin datos de entrega es para llevar', () => {
    expect(openRequest({ kind: 'takeaway', customerName: '' }, items, 'x')).toMatchObject({
      type: 'takeaway',
      customer_id: null,
    })
  })
})

describe('newOrderPath', () => {
  it('lleva los datos del delivery en la URL', () => {
    const ruta = newOrderPath({
      mode: 'delivery',
      customer_name: 'Ana',
      phone: '987',
      address: 'Calle 1',
      reference: '',
      customer_id: 3,
    })
    const params = new URLSearchParams(ruta.split('?')[1])
    expect(params.get('tipo')).toBe('delivery')
    expect(params.get('clienteId')).toBe('3')
    expect(params.get('direccion')).toBe('Calle 1')
  })
})
