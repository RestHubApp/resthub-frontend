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

function espiarConsola() {
  return {
    error: jest.spyOn(console, 'error').mockImplementation(() => undefined),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => undefined),
    info: jest.spyOn(console, 'info').mockImplementation(() => undefined),
    debug: jest.spyOn(console, 'debug').mockImplementation(() => undefined),
  }
}

describe('nivel de los logs', () => {
  it('con nivel error descarta avisos, información y depuración', async () => {
    const { logger } = await loggerCon({ VITE_LOG_LEVEL: 'error' })
    const consola = espiarConsola()

    logger.error('visible')
    logger.warn('oculto')
    logger.info('oculto')
    logger.debug('oculto')

    expect(consola.error).toHaveBeenCalledTimes(1)
    expect(consola.warn).not.toHaveBeenCalled()
    expect(consola.info).not.toHaveBeenCalled()
    expect(consola.debug).not.toHaveBeenCalled()
  })

  it('sin nivel válido, en desarrollo se ve desde debug y se oculta trace', async () => {
    const { logger } = await loggerCon({ VITE_LOG_LEVEL: 'ruidoso', DEV: true })
    const consola = espiarConsola()

    logger.debug('visible')
    logger.trace('oculto')

    expect(consola.debug).toHaveBeenCalledTimes(1)
    expect(consola.debug).not.toHaveBeenCalledWith(expect.objectContaining({ msg: 'oculto' }))
  })

  it('en producción descarta información y depuración, y deja avisos y errores', async () => {
    const { logger } = await loggerCon({ VITE_LOG_LEVEL: undefined, DEV: false })
    const consola = espiarConsola()

    logger.debug('oculto')
    logger.info('oculto')
    logger.warn('aviso')
    logger.error('fallo')

    expect(consola.debug).not.toHaveBeenCalled()
    expect(consola.info).not.toHaveBeenCalled()
    expect(consola.warn).toHaveBeenCalledTimes(1)
    expect(consola.error).toHaveBeenCalledTimes(1)
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
