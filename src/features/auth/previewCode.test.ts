import { describe, expect, it } from '@jest/globals'

import { ApiError } from '@/services/apiError'
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

const REQUEST = { method: 'post', path: '/api/v1/auth/preview', requestId: 'req-1' }

function rejected(status: number, code: string, detail = 'Error de prueba'): ApiError {
  return new ApiError({ ...REQUEST, status, body: { detail, code } })
}

describe('failureOf', () => {
  it('`invalid_preview_code` es un código vencido, inválido o ya usado', () => {
    expect(failureOf(rejected(401, 'invalid_preview_code'))).toBe('invalid')
    expect(failureOf(rejected(422, 'validation_error'))).toBe('invalid')
  })

  it('no depende del código HTTP ni del texto: el mismo 401 con otro código es otra cosa', () => {
    expect(failureOf(rejected(401, 'unauthenticated', 'El código de vista previa no vale.'))).toBe('failed')
  })

  it('sin respuesta es falta de conexión', () => {
    expect(failureOf(new ApiError({ ...REQUEST, reason: 'network' }))).toBe('offline')
    expect(failureOf(new Error('sin red'))).toBe('offline')
  })

  it('lo demás es un error del servidor', () => {
    expect(failureOf(rejected(500, 'http_error'))).toBe('failed')
    expect(failureOf(rejected(403, 'forbidden'))).toBe('failed')
  })
})
