/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Cada prueba carga el logger de nuevo con otras variables de entorno de Vite.
import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { stubGlobal, unstubAllGlobals } from '#jest/globals'

type Environment = Record<string, unknown>

async function loggerWith(environment: Environment) {
  const previous = (globalThis as { __VITE_ENV__?: Environment }).__VITE_ENV__
  stubGlobal('__VITE_ENV__', { ...previous, ...environment })
  jest.resetModules()
  return import('./logger')
}

afterEach(() => {
  unstubAllGlobals()
})

function spyConsole() {
  return {
    error: jest.spyOn(console, 'error').mockImplementation(() => undefined),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => undefined),
    info: jest.spyOn(console, 'info').mockImplementation(() => undefined),
    debug: jest.spyOn(console, 'debug').mockImplementation(() => undefined),
  }
}

describe('nivel de los logs', () => {
  it('con nivel error descarta avisos, información y depuración', async () => {
    const { logger } = await loggerWith({ VITE_LOG_LEVEL: 'error' })
    const console = spyConsole()

    logger.error('visible')
    logger.warn('oculto')
    logger.info('oculto')
    logger.debug('oculto')

    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.debug).not.toHaveBeenCalled()
  })

  it('sin nivel válido, en desarrollo se ve desde debug y se oculta trace', async () => {
    const { logger } = await loggerWith({ VITE_LOG_LEVEL: 'ruidoso', DEV: true })
    const console = spyConsole()

    logger.debug('visible')
    logger.trace('oculto')

    expect(console.debug).toHaveBeenCalledTimes(1)
    expect(console.debug).not.toHaveBeenCalledWith(expect.objectContaining({ msg: 'oculto' }))
  })

  it('en producción descarta información y depuración, y deja avisos y errores', async () => {
    const { logger } = await loggerWith({ VITE_LOG_LEVEL: undefined, DEV: false })
    const console = spyConsole()

    logger.debug('oculto')
    logger.info('oculto')
    logger.warn('aviso')
    logger.error('fallo')

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })
})

describe('errores que nadie capturó', () => {
  it('quedan en el log con su origen', async () => {
    const { logger, logUncaughtErrors } = await loggerWith({ VITE_LOG_LEVEL: 'error' })
    const handlers = new Map<string, (event: unknown) => void>()
    stubGlobal('window', { addEventListener: (type: string, fn: (event: unknown) => void) => handlers.set(type, fn) })
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined)

    logUncaughtErrors()
    handlers.get('error')?.({ error: new Error('boom'), filename: 'app.js', lineno: 12 })
    handlers.get('unhandledrejection')?.({ reason: 'sin catch' })

    expect(error).toHaveBeenCalledWith(expect.objectContaining({ source: 'app.js', line: 12 }), 'app.uncaught_error')
    expect(error).toHaveBeenCalledWith({ err: 'sin catch' }, 'app.unhandled_rejection')
  })
})
