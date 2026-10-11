import { describe, expect, it } from '@jest/globals'

import { ApiError, shouldRetry, errorMessage, errorStatus } from './apiError'

const FAILURE = 'No se pudo guardar.'

function apiError(status: number, body: unknown): ApiError {
  return new ApiError({ method: 'post', path: '/api/v1/orders', requestId: 'req-1', status, body })
}

function withoutResponse(): ApiError {
  return new ApiError({ method: 'get', path: '/api/v1/orders', requestId: 'req-1', code: 'network' })
}

describe('mensajes de error del API', () => {
  it('muestra el `detail` que manda el proyecto', () => {
    expect(errorMessage(apiError(409, { detail: 'El pedido cambió' }), FAILURE)).toBe('El pedido cambió')
  })

  it('de un error de validación de Pydantic toma el primer problema', () => {
    const error = apiError(422, { detail: [{ msg: 'El RUC tiene 11 dígitos' }, { msg: 'otro' }] })
    expect(errorMessage(error, FAILURE)).toBe('El RUC tiene 11 dígitos')
  })

  it('sin detalle, o si no es un error del API, usa el mensaje de la pantalla', () => {
    expect(errorMessage(apiError(500, {}), FAILURE)).toBe(FAILURE)
    expect(errorMessage(apiError(500, undefined), FAILURE)).toBe(FAILURE)
    expect(errorMessage(apiError(422, { detail: [] }), FAILURE)).toBe(FAILURE)
    expect(errorMessage(apiError(422, { detail: [{ msg: 3 }] }), FAILURE)).toBe(FAILURE)
    expect(errorMessage(withoutResponse(), FAILURE)).toBe(FAILURE)
    expect(errorMessage(new Error('x'), FAILURE)).toBe(FAILURE)
  })

  it('errorStatus da el código, o nada si ni siquiera respondió', () => {
    expect(errorStatus(apiError(404, {}))).toBe(404)
    expect(errorStatus(withoutResponse())).toBeUndefined()
    expect(errorStatus('texto')).toBeUndefined()
  })
})

describe('debeReintentar', () => {
  it('un 4xx no se repite: no cambia por insistir', () => {
    expect(shouldRetry(0, apiError(401, {}))).toBe(false)
    expect(shouldRetry(0, apiError(422, {}))).toBe(false)
  })

  it('un corte de red o un 5xx se repite una sola vez', () => {
    expect(shouldRetry(0, apiError(503, {}))).toBe(true)
    expect(shouldRetry(1, apiError(503, {}))).toBe(false)
    expect(shouldRetry(0, withoutResponse())).toBe(true)
  })
})
