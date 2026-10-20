import { describe, expect, it } from '@jest/globals'

import { customer } from '#jest/fixtures/orders'
import { EMPTY_TAKEAWAY, fromCustomer, newOrderPath, takeawaySchema } from './takeawaySchema'

describe('takeawaySchema', () => {
  it('para recoger en el local no exige ningún dato', () => {
    expect(takeawaySchema.safeParse(EMPTY_TAKEAWAY).success).toBe(true)
  })

  it('un delivery exige nombre, teléfono y dirección, pero no la referencia', () => {
    const result = takeawaySchema.safeParse({ ...EMPTY_TAKEAWAY, mode: 'delivery' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((issue) => [issue.path[0], issue.message])
    expect(messages).toEqual([
      ['customer_name', 'Escribe el nombre de quien recibe'],
      ['phone', 'Escribe un teléfono para coordinar la entrega'],
      ['address', 'Escribe la dirección de entrega'],
    ])
  })
})

describe('takeawaySchema: el teléfono del delivery', () => {
  const delivery = { ...EMPTY_TAKEAWAY, mode: 'delivery' as const, customer_name: 'Ana', address: 'Calle 1' }

  it('sigue la regla del servidor: solo números y espacios', () => {
    const result = takeawaySchema.safeParse({ ...delivery, phone: '987-654-321' })
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['phone'])
    expect(takeawaySchema.safeParse({ ...delivery, phone: '987 654 321' }).success).toBe(true)
  })

  it('con un cliente de la libreta puede ir vacío: lo completa el servidor', () => {
    expect(takeawaySchema.safeParse({ ...delivery, phone: '', customer_id: 40 }).success).toBe(true)
  })

  it('el teléfono enmascarado de la libreta no se copia al formulario', () => {
    expect(fromCustomer(customer({ phone: '987•••321', masked: true }), 'delivery').phone).toBe('')
    expect(fromCustomer(customer(), 'delivery').phone).toBe('987654321')
  })
})

describe('newOrderPath', () => {
  it('para llevar lleva el tipo y el cliente en la dirección', () => {
    expect(newOrderPath({ ...EMPTY_TAKEAWAY, customer_name: 'Ana' })).toBe('/pedidos/nuevo?tipo=llevar&cliente=Ana')
  })

  it('un delivery de la libreta lleva el id del cliente y sus datos de entrega', () => {
    const route = newOrderPath(fromCustomer(customer(), 'delivery'))
    const params = new URL(route, 'http://localhost').searchParams
    expect(Object.fromEntries(params)).toEqual({
      'tipo': 'delivery',
      'cliente': 'Rosa Quispe',
      'clienteId': '40',
      'telefono': '987654321',
      'direccion': 'Jr. Cusco 120',
      'referencia': 'Frente al parque',
    })
  })

  it('lleva los datos del delivery en la URL', () => {
    const route = newOrderPath({
      mode: 'delivery',
      customer_name: 'Ana',
      phone: '987',
      address: 'Calle 1',
      reference: '',
      customer_id: 3,
      consent: false,
    })
    const params = new URLSearchParams(route.split('?')[1])
    expect(params.get('tipo')).toBe('delivery')
    expect(params.get('clienteId')).toBe('3')
    expect(params.get('direccion')).toBe('Calle 1')
  })
})
