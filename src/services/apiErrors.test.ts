import { describe, expect, it } from '@jest/globals'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'

import { debeReintentar, errorMessage, errorStatus } from './api'

const FALLA = 'No se pudo guardar.'

function errorDelApi(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('fallo', AxiosError.ERR_BAD_REQUEST, config, {}, response)
}

describe('mensajes de error del API', () => {
  it('muestra el `detail` que manda el proyecto', () => {
    expect(errorMessage(errorDelApi(409, { detail: 'El pedido cambió' }), FALLA)).toBe('El pedido cambió')
  })

  it('de un error de validación de Pydantic toma el primer problema', () => {
    const error = errorDelApi(422, { detail: [{ msg: 'El RUC tiene 11 dígitos' }, { msg: 'otro' }] })
    expect(errorMessage(error, FALLA)).toBe('El RUC tiene 11 dígitos')
  })

  it('sin detalle, o si no es un error de Axios, usa el mensaje de la pantalla', () => {
    expect(errorMessage(errorDelApi(500, {}), FALLA)).toBe(FALLA)
    expect(errorMessage(errorDelApi(422, { detail: [] }), FALLA)).toBe(FALLA)
    expect(errorMessage(new Error('x'), FALLA)).toBe(FALLA)
  })

  it('errorStatus da el código, o nada si ni siquiera respondió', () => {
    expect(errorStatus(errorDelApi(404, {}))).toBe(404)
    expect(errorStatus(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBeUndefined()
    expect(errorStatus('texto')).toBeUndefined()
  })
})

describe('debeReintentar', () => {
  it('un 4xx no se repite: no cambia por insistir', () => {
    expect(debeReintentar(0, errorDelApi(401, {}))).toBe(false)
    expect(debeReintentar(0, errorDelApi(422, {}))).toBe(false)
  })

  it('un corte de red o un 5xx se repite una sola vez', () => {
    expect(debeReintentar(0, errorDelApi(503, {}))).toBe(true)
    expect(debeReintentar(1, errorDelApi(503, {}))).toBe(false)
    expect(debeReintentar(0, new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe(true)
  })
})
