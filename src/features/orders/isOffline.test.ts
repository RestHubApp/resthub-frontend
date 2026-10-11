import { describe, expect, it } from '@jest/globals'

import { ApiError } from '@/services/apiError'
import { isOffline } from './isOffline'

const REQUEST = { method: 'post', path: '/api/v1/orders', requestId: 'req-1' }

function errorResponse(status: number, code?: string): ApiError {
  return new ApiError({ ...REQUEST, status, body: code === undefined ? {} : { detail: 'Error de prueba', code } })
}

describe('isOffline', () => {
  it('una petición que venció su plazo cuenta como sin señal', () => {
    expect(isOffline(new ApiError({ ...REQUEST, reason: 'timeout' }))).toBe(true)
  })

  it('un corte de red o el proxy sin servidor también', () => {
    expect(isOffline(new ApiError({ ...REQUEST, reason: 'network' }))).toBe(true)
    expect(isOffline(errorResponse(503))).toBe(true)
  })

  it('el servicio caído se reconoce por su código, no por el estado', () => {
    expect(isOffline(errorResponse(500, 'database_unavailable'))).toBe(true)
    expect(isOffline(errorResponse(503, 'request_timeout'))).toBe(true)
    expect(isOffline(errorResponse(503, 'conflict'))).toBe(false)
  })

  it('un rechazo del servidor no se reintenta desde la cola', () => {
    expect(isOffline(errorResponse(409, 'conflict'))).toBe(false)
    expect(isOffline(errorResponse(422, 'validation_error'))).toBe(false)
  })
})
