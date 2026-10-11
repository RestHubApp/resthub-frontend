import { describe, expect, it } from '@jest/globals'

import { supplier } from '#jest/fixtures/inventory'
import { supplierSchema, supplierValuesOf } from './supplierSchema'

describe('supplierValuesOf', () => {
  it('sin proveedor, el formulario parte vacío', () => {
    expect(supplierValuesOf(null)).toEqual({ name: '', contact: '', phone: '', notes: '' })
  })

  it('con proveedor, copia sus datos', () => {
    const values = supplierValuesOf(supplier({ name: 'Mercado', contact: '', phone: '999', notes: '' }))

    expect(values).toEqual({ name: 'Mercado', contact: '', phone: '999', notes: '' })
  })
})

describe('supplierSchema', () => {
  it('exige el nombre', () => {
    expect(supplierSchema.safeParse({ name: '  ', contact: '', phone: '', notes: '' }).success).toBe(false)
  })
})
