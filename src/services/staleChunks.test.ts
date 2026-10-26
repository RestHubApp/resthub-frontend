import { describe, expect, it, jest } from '@jest/globals'

import {
  reloadForStaleChunk,
  reloadOnStaleChunks,
  STALE_CHUNK_RELOAD_KEY,
  STALE_CHUNK_RETRY_MS,
  type StaleChunkPage,
} from './staleChunks'
import type { KeyValueStorage } from './tabStorage'

const { readFileSync } = jest.requireActual<{ readFileSync: (file: string, encoding: 'utf8') => string }>('node:fs')

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

function page(storage: KeyValueStorage | null, at: { now: number }): StaleChunkPage & { reload: jest.Mock<() => void> } {
  return { storage, now: () => at.now, reload: jest.fn<() => void>() }
}

describe('reloadForStaleChunk', () => {
  it('recarga la primera vez y no otra vez si el trozo sigue faltando enseguida', () => {
    const at = { now: 1_000_000 }
    const tab = page(memoryStorage(), at)

    expect(reloadForStaleChunk(tab)).toBe(true)
    at.now += STALE_CHUNK_RETRY_MS - 1
    expect(reloadForStaleChunk(tab)).toBe(false)
    expect(tab.reload).toHaveBeenCalledTimes(1)
  })

  it('vuelve a recargar ante el despliegue siguiente, pasado el plazo', () => {
    const at = { now: 1_000_000 }
    const tab = page(memoryStorage(), at)

    reloadForStaleChunk(tab)
    at.now += STALE_CHUNK_RETRY_MS
    expect(reloadForStaleChunk(tab)).toBe(true)
    expect(tab.reload).toHaveBeenCalledTimes(2)
  })

  it('no recarga sin almacenamiento ni si el almacenamiento falla', () => {
    const blocked: KeyValueStorage = {
      getItem: () => { throw new Error('bloqueado') },
      setItem: () => { throw new Error('bloqueado') },
      removeItem: () => undefined,
    }
    const without = page(null, { now: 0 })
    const failing = page(blocked, { now: 0 })

    expect(reloadForStaleChunk(without)).toBe(false)
    expect(reloadForStaleChunk(failing)).toBe(false)
    expect(without.reload).not.toHaveBeenCalled()
    expect(failing.reload).not.toHaveBeenCalled()
  })
})

describe('reloadOnStaleChunks', () => {
  it('ante vite:preloadError recarga una vez y frena el error solo esa vez', () => {
    const storage = memoryStorage()
    const tab = page(storage, { now: 5_000 })
    reloadOnStaleChunks(tab)

    const first = new Event('vite:preloadError', { cancelable: true })
    const second = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(first)
    window.dispatchEvent(second)

    expect(tab.reload).toHaveBeenCalledTimes(1)
    expect(first.defaultPrevented).toBe(true)
    expect(second.defaultPrevented).toBe(false)
    expect(storage.getItem(STALE_CHUNK_RELOAD_KEY)).toBe('5000')
  })
})

describe('reescritura de Vercel', () => {
  interface VercelConfig {
    readonly rewrites: readonly { readonly source: string; readonly destination: string }[]
  }
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig
  const [spa] = vercel.rewrites
  // La misma expresión que `source`, que Vercel lee como path-to-regexp.
  const SPA_SOURCE = /^\/((?!assets\/).*)$/u
  const matches = (path: string): boolean => SPA_SOURCE.test(path)

  it('manda las rutas de la aplicación a index.html', () => {
    expect(spa).toEqual({ source: '/((?!assets/).*)', destination: '/index.html' })
    expect(matches('/acceso')).toBe(true)
    expect(matches('/plataforma/restaurantes/7')).toBe(true)
  })

  it('no reescribe /assets: un trozo que ya no existe da 404, no el HTML', () => {
    expect(matches('/assets/LoginView-DLOkZCOL.js')).toBe(false)
  })
})
