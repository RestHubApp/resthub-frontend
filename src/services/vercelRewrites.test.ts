import { describe, expect, it, jest } from '@jest/globals'

// La vuelta de las rutas de la aplicación a index.html que hace Vercel (vercel.json).
const { readFileSync } = jest.requireActual<{ readFileSync: (file: string, encoding: 'utf8') => string }>('node:fs')

interface VercelConfig {
  readonly rewrites: readonly { readonly source: string; readonly destination: string }[]
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig
const fallback = vercel.rewrites.find(({ destination }) => destination === '/index.html')
// Vercel lee `source` como una expresión regular de ruta; la de esta regla no tiene parámetros.
// eslint-disable-next-line security/detect-non-literal-regexp -- el patrón es el de vercel.json del repositorio, no datos externos
const servesIndex = new RegExp(`^${fallback?.source ?? ''}$`, 'u')

describe('rutas que Vercel responde con index.html', () => {
  it('un archivo de /assets que ya no existe da 404, no el HTML (el service worker no lo guarda como JS)', () => {
    expect(servesIndex.test('/assets/OrdersView-abc123.js')).toBe(false)
    expect(servesIndex.test('/assets/index-abc123.css')).toBe(false)
  })

  it('las pantallas de la aplicación siguen llegando a index.html', () => {
    for (const route of ['/', '/pedidos/12', '/plataforma/restaurantes', '/acceso']) {
      expect(servesIndex.test(route)).toBe(true)
    }
  })
})
