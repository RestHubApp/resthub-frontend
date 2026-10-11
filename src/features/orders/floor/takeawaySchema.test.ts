import { describe, expect, it } from '@jest/globals'

import { customer } from '#jest/fixtures/pedidos'
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

describe('newOrderPath', () => {
  it('para llevar lleva el tipo y el cliente en la dirección', () => {
    expect(newOrderPath({ ...EMPTY_TAKEAWAY, customer_name: 'Ana' })).toBe('/pedidos/nuevo?tipo=llevar&cliente=Ana')
  })

  it('un delivery de la libreta lleva el id del cliente y sus datos de entrega', () => {
    const route = newOrderPath(fromCustomer(customer(), 'delivery'))
    const params = new URL(route, 'http://localhost').searchParams
    expect(Object.fromEntries(params)).toEqual({
      tipo: 'delivery',
      cliente: 'Rosa Quispe',
      clienteId: '40',
      telefono: '987654321',
      direccion: 'Jr. Cusco 120',
      referencia: 'Frente al parque',
    })
  })
})
