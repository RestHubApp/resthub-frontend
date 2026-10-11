import { describe, expect, it } from '@jest/globals'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'

import { shouldRetry, errorMessage, errorStatus } from './api'

const FAILURE = 'No se pudo guardar.'

function apiError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('fallo', AxiosError.ERR_BAD_REQUEST, config, {}, response)
}

describe('mensajes de error del API', () => {
  it('muestra el `detail` que manda el proyecto', () => {
    expect(errorMessage(apiError(409, { detail: 'El pedido cambió' }), FAILURE)).toBe('El pedido cambió')
  })

  it('de un error de validación de Pydantic toma el primer problema', () => {
    const error = apiError(422, { detail: [{ msg: 'El RUC tiene 11 dígitos' }, { msg: 'otro' }] })
    expect(errorMessage(error, FAILURE)).toBe('El RUC tiene 11 dígitos')
  })

  it('sin detalle, o si no es un error de Axios, usa el mensaje de la pantalla', () => {
    expect(errorMessage(apiError(500, {}), FAILURE)).toBe(FAILURE)
    expect(errorMessage(apiError(422, { detail: [] }), FAILURE)).toBe(FAILURE)
    expect(errorMessage(new Error('x'), FAILURE)).toBe(FAILURE)
  })

  it('errorStatus da el código, o nada si ni siquiera respondió', () => {
    expect(errorStatus(apiError(404, {}))).toBe(404)
    expect(errorStatus(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBeUndefined()
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
    expect(shouldRetry(0, new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe(true)
  })
})
