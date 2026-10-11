import { describe, expect, it } from '@jest/globals'

import { ApiError, errorCode, errorMessage, errorStatus, hasCode, isSessionEnded, isTransportFailure, shouldRetry } from './apiError'

const FAILURE = 'No se pudo guardar.'

function apiError(status: number, body: unknown): ApiError {
  return new ApiError({ method: 'post', path: '/api/v1/orders', requestId: 'req-1', status, body })
}

function withoutResponse(): ApiError {
  return new ApiError({ method: 'get', path: '/api/v1/orders', requestId: 'req-1', reason: 'network' })
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

  it('el texto del `detail` no cambia el código del error', () => {
    const error = apiError(409, { detail: 'La mesa está ocupada.', code: 'conflict' })
    expect(errorCode(error)).toBe('conflict')
    expect(errorCode(apiError(409, { detail: 'La mesa está ocupada.', code: 'table_occupied' }))).toBe('table_occupied')
  })
})

describe('código del error', () => {
  it('lo da el cuerpo del servidor, o nada si no hay respuesta, cuerpo ni código', () => {
    expect(errorCode(apiError(404, { detail: 'x', code: 'invoice_not_found' }))).toBe('invoice_not_found')
    expect(errorCode(apiError(422, { detail: [{ msg: 'x' }], code: 'validation_error', errors: [] }))).toBe('validation_error')
    expect(errorCode(apiError(502, undefined))).toBeUndefined()
    expect(errorCode(apiError(502, { code: 3 }))).toBeUndefined()
    expect(errorCode(withoutResponse())).toBeUndefined()
    expect(errorCode('texto')).toBeUndefined()
  })

  it('hasCode compara con cualquiera de los códigos dados', () => {
    const error = apiError(409, { code: 'phone_taken' })
    expect(hasCode(error, 'phone_taken')).toBe(true)
    expect(hasCode(error, 'email_already_registered', 'phone_taken')).toBe(true)
    expect(hasCode(error, 'conflict')).toBe(false)
    expect(hasCode(new Error('phone_taken'), 'phone_taken')).toBe(false)
  })

  it('una sesión se acaba por `unauthenticated` o `invalid_token`, no por el 401 en sí', () => {
    expect(isSessionEnded(apiError(401, { code: 'unauthenticated' }))).toBe(true)
    expect(isSessionEnded(apiError(401, { code: 'invalid_token' }))).toBe(true)
    expect(isSessionEnded(apiError(401, { code: 'invalid_credentials' }))).toBe(false)
    expect(isSessionEnded(apiError(401, {}))).toBe(false)
  })

  it('un cambio de estado o un servicio caído es un corte; un rechazo, no', () => {
    expect(isTransportFailure(apiError(409, { code: 'conflict' }))).toBe(true)
    expect(isTransportFailure(apiError(409, { code: 'balance_changed' }))).toBe(true)
    expect(isTransportFailure(apiError(503, { code: 'database_unavailable' }))).toBe(true)
    expect(isTransportFailure(apiError(409, { code: 'table_occupied' }))).toBe(false)
    expect(isTransportFailure(apiError(401, { code: 'unauthenticated' }))).toBe(false)
    expect(isTransportFailure(withoutResponse())).toBe(true)
  })
})

describe('debeReintentar', () => {
  it('un rechazo del servidor no se repite: no cambia por insistir', () => {
    expect(shouldRetry(0, apiError(401, { code: 'unauthenticated' }))).toBe(false)
    expect(shouldRetry(0, apiError(422, { code: 'validation_error' }))).toBe(false)
    expect(shouldRetry(0, apiError(409, { code: 'table_occupied' }))).toBe(false)
    expect(shouldRetry(0, apiError(429, { code: 'login_throttled' }))).toBe(false)
  })

  it('un corte de red o un servicio caído se repite una sola vez', () => {
    expect(shouldRetry(0, apiError(503, { code: 'database_unavailable' }))).toBe(true)
    expect(shouldRetry(0, apiError(503, { code: 'request_timeout' }))).toBe(true)
    expect(shouldRetry(1, apiError(503, { code: 'database_unavailable' }))).toBe(false)
    expect(shouldRetry(0, withoutResponse())).toBe(true)
  })

  it('un error sin código propio (el proxy, un 500 sin cuerpo) se juzga por su estado', () => {
    expect(shouldRetry(0, apiError(502, undefined))).toBe(true)
    expect(shouldRetry(0, apiError(500, { code: 'http_error' }))).toBe(true)
    expect(shouldRetry(0, apiError(404, undefined))).toBe(false)
  })
})

describe('estado HTTP', () => {
  it('errorStatus da el estado, o nada si ni siquiera respondió', () => {
    expect(errorStatus(apiError(404, {}))).toBe(404)
    expect(errorStatus(withoutResponse())).toBeUndefined()
    expect(errorStatus('texto')).toBeUndefined()
  })
})
