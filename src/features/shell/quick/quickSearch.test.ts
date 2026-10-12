import { describe, expect, it } from '@jest/globals'

import { matchScore, normalizeText } from './quickSearch'

describe('normalizeText', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizeText('  Menú ÁÉÍÓÚ ñ ')).toBe('menu aeiou n')
  })
})

describe('matchScore', () => {
  it('sin nada escrito todo coincide', () => {
    expect(matchScore('', ['Caja'])).toBe(1)
    expect(matchScore('   ', ['Caja'])).toBe(1)
  })

  it('«menu» encuentra «Menú» y «MENÚ» encuentra «menu»', () => {
    expect(matchScore('menu', ['Menú'])).toBe(1)
    expect(matchScore('MENÚ', ['menu'])).toBe(1)
  })

  it('pide todas las palabras, en cualquier orden', () => {
    expect(matchScore('caja abrir', ['Abrir caja', 'En Caja'])).toBeGreaterThan(0)
    expect(matchScore('caja cerrar', ['Abrir caja'])).toBe(0)
  })

  it('busca también en la descripción y los sinónimos, con menos peso que el nombre', () => {
    const byName = matchScore('carta', ['Carta del día', 'Platos'])
    const bySynonym = matchScore('carta', ['Menú', 'Categorías y platos', 'carta'])
    expect(bySynonym).toBeGreaterThan(0)
    expect(bySynonym).toBeLessThan(byName)
  })

  it('no coincide con lo que no está', () => {
    expect(matchScore('zzz', ['Menú', 'Caja'])).toBe(0)
  })
})
