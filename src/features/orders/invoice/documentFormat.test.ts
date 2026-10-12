import { describe, expect, it } from '@jest/globals'

import { formatProblem, isValidDni, isValidRuc, lookupTypeOf } from './documentFormat'

describe('documentFormat', () => {
  it('un RUC vale con 11 dígitos y su dígito verificador', () => {
    expect(isValidRuc('20100070970')).toBe(true)
    expect(isValidRuc('20100070971')).toBe(false)
    expect(isValidRuc('2010007097')).toBe(false)
    expect(isValidRuc('2010007097a')).toBe(false)
  })

  it('un DNI vale con 8 dígitos', () => {
    expect(isValidDni('12345678')).toBe(true)
    expect(isValidDni('1234567')).toBe(false)
  })

  it('solo el RUC y el DNI se buscan', () => {
    expect(lookupTypeOf('ruc')).toBe('ruc')
    expect(lookupTypeOf('dni')).toBe('dni')
    expect(lookupTypeOf('ce')).toBeNull()
    expect(lookupTypeOf('none')).toBeNull()
  })

  it('dice qué corregir antes de buscar', () => {
    expect(formatProblem('ruc', '2010')).toBe('El RUC tiene 11 dígitos.')
    expect(formatProblem('ruc', '20100070971')).toBe('El RUC no es válido: revisa los números.')
    expect(formatProblem('ruc', '20100070970')).toBeNull()
    expect(formatProblem('dni', '123')).toBe('El DNI tiene 8 dígitos.')
    expect(formatProblem('dni', '12345678')).toBeNull()
  })
})
