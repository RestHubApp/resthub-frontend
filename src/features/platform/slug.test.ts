import { describe, expect, it } from 'vitest'

import { followSlug, isValidSlug, MAX_SLUG, sanitizeSlugInput, suggestSlug } from './slug'

const ESQUINA = 'La Esquina'

describe('suggestSlug', () => {
  it('pasa a minúsculas, quita tildes y une con guiones', () => {
    expect(suggestSlug('La Esquina de Lucho')).toBe('la-esquina-de-lucho')
    expect(suggestSlug('Café Ñandú & Co.')).toBe('cafe-nandu-co')
    expect(suggestSlug('  Pollería   El Rey #2  ')).toBe('polleria-el-rey-2')
  })

  it('no deja guiones en los extremos ni pasa del largo máximo', () => {
    expect(suggestSlug('¡¡Sabor!!')).toBe('sabor')
    const largo = suggestSlug(`${'a'.repeat(MAX_SLUG - 1)} bb`)
    expect(largo.length).toBeLessThanOrEqual(MAX_SLUG)
    expect(largo.endsWith('-')).toBe(false)
  })

  it('lo que sugiere siempre es válido, salvo que el nombre no tenga letras ni números', () => {
    expect(isValidSlug(suggestSlug('Chifa Wa Lok'))).toBe(true)
    expect(suggestSlug('***')).toBe('')
  })
})

describe('isValidSlug', () => {
  it('acepta minúsculas, números y guiones sueltos entre palabras', () => {
    expect(isValidSlug('la-esquina-2')).toBe(true)
    expect(isValidSlug('resthub')).toBe(true)
  })

  it('rechaza mayúsculas, tildes, espacios y guiones en los extremos o dobles', () => {
    for (const malo of ['La-Esquina', 'café', 'la esquina', '-esquina', 'esquina-', 'la--esquina', '']) {
      expect(isValidSlug(malo)).toBe(false)
    }
    expect(isValidSlug('a'.repeat(MAX_SLUG + 1))).toBe(false)
  })
})

describe('sanitizeSlugInput', () => {
  it('limpia mientras se escribe y deja el guion final para seguir', () => {
    expect(sanitizeSlugInput('La Esquina ')).toBe('la-esquina-')
    expect(sanitizeSlugInput('Ñandú!!')).toBe('nandu')
    expect(sanitizeSlugInput('a--b')).toBe('a-b')
  })
})

describe('followSlug', () => {
  it('sigue al nombre mientras nadie tocó el identificador', () => {
    expect(followSlug('', 'L', '')).toBe('l')
    expect(followSlug('La', ESQUINA, 'la')).toBe('la-esquina')
  })

  it('respeta un identificador editado a mano', () => {
    expect(followSlug(ESQUINA, `${ESQUINA} de Lucho`, 'esquina-lucho')).toBe('esquina-lucho')
  })

  it('vuelve a sugerir si se vació el identificador', () => {
    expect(followSlug(ESQUINA, `${ESQUINA} 2`, '')).toBe('la-esquina-2')
  })
})
