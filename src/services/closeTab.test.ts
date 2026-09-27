/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Sin DOM: `window` es un doble con `close`, `setTimeout` y `location.replace`.
import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { stubGlobal, unstubAllGlobals } from '#jest/globals'
import { closeTabOrGo } from './leaveTab'

afterEach(() => {
  unstubAllGlobals()
  jest.useRealTimers()
})

describe('closeTabOrGo', () => {
  it('intenta cerrar la pestaña y, si sigue abierta, recarga la aplicación en la ruta', () => {
    jest.useFakeTimers()
    const ventana = { close: jest.fn(), setTimeout, location: { replace: jest.fn() } }
    stubGlobal('window', ventana)

    closeTabOrGo('/plataforma')

    expect(ventana.close).toHaveBeenCalledTimes(1)
    expect(ventana.location.replace).not.toHaveBeenCalled()
    jest.advanceTimersByTime(200)
    expect(ventana.location.replace).toHaveBeenCalledWith('/plataforma')
  })
})
