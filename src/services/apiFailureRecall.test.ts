import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it } from '@jest/globals'

import { api } from './api'
import { apiFailureMessage, clearApiFailure } from './apiFailure'

const CORTE = 'Servicio no disponible.'
const MESAS = '/tables'

function caido(config: InternalAxiosRequestConfig): Promise<never> {
  const response = { data: { detail: CORTE }, status: 503, statusText: 'Unavailable', headers: {}, config }
  return Promise.reject(new AxiosError('503', 'ERR_BAD_RESPONSE', config, null, response))
}

function sano(config: InternalAxiosRequestConfig): Promise<AxiosResponse<object>> {
  return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
}

afterEach(() => {
  clearApiFailure()
})

describe('el corte que recuerda el armazón', () => {
  it('una lectura caída se recuerda y se olvida cuando otra lectura responde', async () => {
    await expect(api.get(MESAS, { adapter: caido })).rejects.toThrow()
    expect(apiFailureMessage('restaurant')).toBe(CORTE)

    await api.get(MESAS, { adapter: sano })
    expect(apiFailureMessage('restaurant')).toBeNull()
  })

  it('una escritura caída no queda en el armazón: la avisa su formulario', async () => {
    await expect(api.post('/customers', {}, { adapter: caido })).rejects.toThrow()
    expect(apiFailureMessage('restaurant')).toBeNull()
  })

  it('una lectura de plataforma que responde no borra el corte del restaurante', async () => {
    await expect(api.get(MESAS, { adapter: caido })).rejects.toThrow()
    await api.get('/platform/restaurants', { adapter: sano })
    expect(apiFailureMessage('restaurant')).toBe(CORTE)
  })
})
