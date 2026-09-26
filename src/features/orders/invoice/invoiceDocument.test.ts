import { describe, expect, it } from 'vitest'

import { customerComplete, documentOptions, effectiveDocument } from './invoiceDocument'

const HASTA_700 = 70000
const SOBRE_700 = 70001

function valores(kind: 'boleta' | 'factura', total: number) {
  return documentOptions(kind, total).map((d) => d.value)
}

describe('documentOptions', () => {
  it('una boleta de hasta S/ 700 puede ir a clientes varios', () => {
    expect(valores('boleta', HASTA_700)).toEqual(['none', 'dni', 'ce', 'ruc'])
  })

  it('sobre S/ 700 la boleta pide documento', () => {
    expect(valores('boleta', SOBRE_700)).toEqual(['dni', 'ce', 'ruc'])
  })

  it('la factura va solo con RUC, sea cual sea el total', () => {
    expect(valores('factura', 1000)).toEqual(['ruc'])
  })
})

describe('effectiveDocument', () => {
  it('sin elegir, una boleta sobre S/ 700 queda en DNI, lo que muestra el select', () => {
    expect(effectiveDocument('boleta', 'none', SOBRE_700)).toBe('dni')
  })

  it('respeta lo elegido si vale', () => {
    expect(effectiveDocument('boleta', 'ce', SOBRE_700)).toBe('ce')
    expect(effectiveDocument('boleta', 'none', HASTA_700)).toBe('none')
  })

  it('la factura va con RUC aunque la boleta tuviera DNI', () => {
    expect(effectiveDocument('factura', 'dni', HASTA_700)).toBe('ruc')
  })
})

describe('customerComplete', () => {
  it('clientes varios no pide nada', () => {
    expect(customerComplete('none', '', '')).toBe(true)
  })

  it('con documento hacen falta el número y el nombre', () => {
    expect(customerComplete('dni', '12345678', '')).toBe(false)
    expect(customerComplete('dni', '  ', 'Ana')).toBe(false)
    expect(customerComplete('ruc', '20123456789', 'Restaurante SAC')).toBe(true)
  })
})
