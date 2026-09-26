import { describe, expect, it } from 'vitest'

import { failureOf, previewCodeFrom, withoutHash } from './previewCode'

describe('previewCodeFrom', () => {
  it('lee el código del fragmento', () => {
    expect(previewCodeFrom('#codigo=abc-123')).toBe('abc-123')
    expect(previewCodeFrom('codigo=abc')).toBe('abc')
  })

  it('decodifica lo que se codificó al armar el enlace', () => {
    expect(previewCodeFrom(`#codigo=${encodeURIComponent('a+b/c=')}`)).toBe('a+b/c=')
  })

  it('sin código, vacío o demasiado largo no hay nada que canjear', () => {
    expect(previewCodeFrom('')).toBeNull()
    expect(previewCodeFrom('#')).toBeNull()
    expect(previewCodeFrom('#codigo=')).toBeNull()
    expect(previewCodeFrom('#codigo=%20%20')).toBeNull()
    expect(previewCodeFrom('#otro=abc')).toBeNull()
    expect(previewCodeFrom(`#codigo=${'x'.repeat(257)}`)).toBeNull()
  })
})

describe('withoutHash', () => {
  it('deja la ruta y la consulta, sin el fragmento', () => {
    expect(withoutHash({ pathname: '/vista-previa', search: '' })).toBe('/vista-previa')
    expect(withoutHash({ pathname: '/app/vista-previa', search: '?x=1' })).toBe('/app/vista-previa?x=1')
  })
})

describe('failureOf', () => {
  it('un 401 es un código vencido, inválido o ya usado', () => {
    expect(failureOf(401)).toBe('invalid')
    expect(failureOf(422)).toBe('invalid')
  })

  it('sin respuesta es falta de conexión', () => {
    expect(failureOf(undefined)).toBe('offline')
  })

  it('lo demás es un error del servidor', () => {
    expect(failureOf(500)).toBe('failed')
    expect(failureOf(403)).toBe('failed')
  })
})
