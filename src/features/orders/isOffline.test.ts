import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from '@jest/globals'

import { isOffline } from './isOffline'

function errorResponse(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { status, data: {}, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('rechazado', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

describe('isOffline', () => {
  it('una petición que venció su plazo cuenta como sin señal', () => {
    expect(isOffline(new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED))).toBe(true)
    expect(isOffline(new AxiosError('timeout exceeded', AxiosError.ETIMEDOUT))).toBe(true)
  })

  it('un corte de red o el proxy sin servidor también', () => {
    expect(isOffline(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe(true)
    expect(isOffline(errorResponse(503))).toBe(true)
  })

  it('un rechazo del servidor no se reintenta desde la cola', () => {
    expect(isOffline(errorResponse(409))).toBe(false)
    expect(isOffline(errorResponse(422))).toBe(false)
  })
})
