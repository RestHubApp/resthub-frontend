/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Cada prueba carga el logger de nuevo con otras variables de entorno de Vite.
import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { stubGlobal, unstubAllGlobals } from '#jest/globals'

type Entorno = Record<string, unknown>

async function loggerCon(entorno: Entorno) {
  const anterior = (globalThis as { __VITE_ENV__?: Entorno }).__VITE_ENV__
  stubGlobal('__VITE_ENV__', { ...anterior, ...entorno })
  jest.resetModules()
  return import('./logger')
}

afterEach(() => {
  unstubAllGlobals()
})

describe('nivel de los logs', () => {
  it('respeta VITE_LOG_LEVEL si es un nivel válido', async () => {
    const { logger } = await loggerCon({ VITE_LOG_LEVEL: 'error' })
    expect(logger.level).toBe('error')
  })

  it('sin nivel válido, en desarrollo se ve desde debug', async () => {
    const { logger } = await loggerCon({ VITE_LOG_LEVEL: 'ruidoso', DEV: true })
    expect(logger.level).toBe('debug')
  })

  it('en producción, solo avisos y errores', async () => {
    const { logger } = await loggerCon({ VITE_LOG_LEVEL: undefined, DEV: false })
    expect(logger.level).toBe('warn')
  })
})

describe('errores que nadie capturó', () => {
  it('quedan en el log con su origen', async () => {
    const { logger, logUncaughtErrors } = await loggerCon({ VITE_LOG_LEVEL: 'error' })
    const manejadores = new Map<string, (evento: unknown) => void>()
    stubGlobal('window', { addEventListener: (tipo: string, fn: (evento: unknown) => void) => manejadores.set(tipo, fn) })
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined)

    logUncaughtErrors()
    manejadores.get('error')?.({ error: new Error('boom'), filename: 'app.js', lineno: 12 })
    manejadores.get('unhandledrejection')?.({ reason: 'sin catch' })

    expect(error).toHaveBeenCalledWith(expect.objectContaining({ source: 'app.js', line: 12 }), 'app.uncaught_error')
    expect(error).toHaveBeenCalledWith({ err: 'sin catch' }, 'app.unhandled_rejection')
  })
})
