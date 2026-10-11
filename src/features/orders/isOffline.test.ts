import { describe, expect, it } from '@jest/globals'

import { ApiError } from '@/services/apiError'
import { isOffline } from './isOffline'

const REQUEST = { method: 'post', path: '/api/v1/orders', requestId: 'req-1' }

function errorResponse(status: number): ApiError {
  return new ApiError({ ...REQUEST, status, body: {} })
}

describe('isOffline', () => {
  it('una petición que venció su plazo cuenta como sin señal', () => {
    expect(isOffline(new ApiError({ ...REQUEST, code: 'timeout' }))).toBe(true)
  })

  it('un corte de red o el proxy sin servidor también', () => {
    expect(isOffline(new ApiError({ ...REQUEST, code: 'network' }))).toBe(true)
    expect(isOffline(errorResponse(503))).toBe(true)
  })

  it('un rechazo del servidor no se reintenta desde la cola', () => {
    expect(isOffline(errorResponse(409))).toBe(false)
    expect(isOffline(errorResponse(422))).toBe(false)
  })
})
