import { describe, expect, it } from '@jest/globals'

import { amountCents, chargeSchema, tipCents } from './chargeSchema'
import { discountSchema } from './discountSchema'

const COBRO = 5000
const MOTIVO = 'Demora en cocina'

function errores(valores: { payment_method: string; amount_received: string; tip: string }) {
  const resultado = chargeSchema(COBRO).safeParse(valores)
  return resultado.success ? {} : Object.fromEntries(resultado.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('amountCents y tipCents', () => {
  it('leen montos con punto o coma y hasta dos decimales', () => {
    expect(amountCents('100')).toBe(10000)
    expect(amountCents(' 12,5 ')).toBe(1250)
    expect(amountCents('0.99')).toBe(99)
  })

  it('rechazan lo que no es un monto', () => {
    expect(amountCents('1.999')).toBeNull()
    expect(amountCents('-5')).toBeNull()
    expect(amountCents('1234567')).toBeNull()
    expect(amountCents('')).toBeNull()
  })

  it('una propina vacía es cero y una mal escrita es null', () => {
    expect(tipCents('  ')).toBe(0)
    expect(tipCents('3')).toBe(300)
    expect(tipCents('tres')).toBeNull()
  })
})

describe('chargeSchema', () => {
  it('en efectivo, vacío es pago exacto', () => {
    expect(errores({ payment_method: 'cash', amount_received: '', tip: '' })).toEqual({})
  })

  it('en efectivo, lo recibido tiene que cubrir la cuenta y la propina', () => {
    expect(errores({ payment_method: 'cash', amount_received: '52', tip: '3' })).toEqual({
      amount_received: 'El monto no cubre lo que se cobra',
    })
    expect(errores({ payment_method: 'cash', amount_received: '53', tip: '3' })).toEqual({})
  })

  it('un monto recibido mal escrito se marca con el formato', () => {
    expect(errores({ payment_method: 'cash', amount_received: 'cien', tip: '' })).toEqual({
      amount_received: 'Escribe un monto como 100 o 100.50',
    })
  })

  it('con otro medio no mira lo recibido, pero sí la propina', () => {
    expect(errores({ payment_method: 'yape', amount_received: '1', tip: '' })).toEqual({})
    expect(errores({ payment_method: 'card', amount_received: '', tip: 'x' })).toEqual({
      tip: 'Escribe un monto como 100 o 100.50',
    })
  })

  it('exige un medio de pago conocido', () => {
    expect(errores({ payment_method: 'bitcoin', amount_received: '', tip: '' })).toHaveProperty('payment_method', 'Elige el medio de pago')
  })
})

describe('discountSchema', () => {
  it('acepta un porcentaje entre 0 y 100 con motivo', () => {
    expect(discountSchema.safeParse({ percent: '12,5', reason: MOTIVO }).success).toBe(true)
  })

  it('rechaza el cero, más de 100 %, tres decimales y un motivo corto', () => {
    expect(discountSchema.safeParse({ percent: '0', reason: MOTIVO }).success).toBe(false)
    expect(discountSchema.safeParse({ percent: '100.01', reason: MOTIVO }).success).toBe(false)
    expect(discountSchema.safeParse({ percent: '5.555', reason: MOTIVO }).success).toBe(false)
    expect(discountSchema.safeParse({ percent: '5', reason: 'ok' }).success).toBe(false)
  })
})
