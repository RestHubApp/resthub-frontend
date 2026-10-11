/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import { cacheLoadedScripts } from './screenCache'

const ORIGIN = 'https://resthub.test'
const SHELL = `${ORIGIN}/assets/index-abc.js`
const SCREEN = `${ORIGIN}/assets/OrdersView-def.js`

function resource(name: string): PerformanceEntry {
  return { name } as PerformanceEntry
}

afterEach(() => {
  unstubAllGlobals()
  jest.restoreAllMocks()
})

describe('cacheLoadedScripts', () => {
  it('guarda los archivos que la página bajó y que ningún caché tiene', async () => {
    const added: string[][] = []
    jest.spyOn(performance, 'getEntriesByType').mockReturnValue([resource(SHELL), resource(SCREEN), resource(`${ORIGIN}/api/v1/tables`), resource(`${ORIGIN}/assets/index-abc.css`)])
    stubGlobal('caches', {
      // El armazón ya está en el precaché del service worker.
      match: (url: string) => Promise.resolve(url === SHELL ? {} : undefined),
      open: () =>
        Promise.resolve({
          addAll: (urls: string[]) => {
            added.push(urls)
            return Promise.resolve()
          },
        }),
    })

    await cacheLoadedScripts()

    expect(added).toEqual([[SCREEN]])
  })

  it('sin Cache Storage no hace nada', async () => {
    jest.spyOn(performance, 'getEntriesByType').mockReturnValue([resource(SCREEN)])

    await expect(cacheLoadedScripts()).resolves.toBeUndefined()
  })
})
