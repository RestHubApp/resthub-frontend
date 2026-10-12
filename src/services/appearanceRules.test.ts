import { describe, expect, it } from '@jest/globals'

import {
  ACCENTS,
  type Appearance,
  BOTTOM_BAR_SLOTS,
  DEFAULT_APPEARANCE,
  isDarkMode,
  MODES,
  parseAppearance,
  resolveTheme,
  serializeAppearance,
  stepTextSize,
  THEMES,
} from './appearanceRules'

function stored(changes: Record<string, unknown>, version = 2): string {
  return JSON.stringify({ version, ...changes })
}

describe('parseAppearance', () => {
  it('sin nada guardado da las preferencias de fábrica', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE)
  })

  it('un JSON roto, un valor que no es objeto o una versión desconocida dan las de fábrica', () => {
    expect(parseAppearance('{no es json')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('"tema"')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('[1, 2]')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('null')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance(stored({ mode: 'dark' }, 99))).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance(stored({ mode: 'dark' }, 3))).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance(JSON.stringify({ mode: 'dark' }))).toEqual(DEFAULT_APPEARANCE)
  })

  it('lee lo que ella misma guardó', () => {
    const appearance: Appearance = {
      mode: 'system',
      accent: 'wine',
      contrast: 'high',
      font: 'lexend',
      textSize: 'largest',
      density: 'compact',
      menu: { order: ['/cocina', '/pedidos'], bottom: ['/cocina'] },
    }

    expect(parseAppearance(serializeAppearance(appearance))).toEqual(appearance)
  })

  it('quien tenía alto contraste con un color en la versión 2 lo conserva junto con el color', () => {
    const migrated = parseAppearance(stored({ accent: 'olive', contrast: 'high', mode: 'dark' }, 2))

    expect(migrated).toMatchObject({ accent: 'olive', contrast: 'high', mode: 'dark' })
    expect(resolveTheme(migrated, false)).toBe('olive-contrast-dark')
  })

  it('cada preferencia inválida vuelve a la de fábrica sin tirar las demás', () => {
    const parsed = parseAppearance(
      stored({ mode: 'neón', accent: 'fucsia', contrast: 'máximo', font: 'lexend', textSize: 99, density: 'enorme', menu: 'raro' }),
    )

    expect(parsed).toEqual({ ...DEFAULT_APPEARANCE, font: 'lexend' })
  })

  it('de las listas del menú solo conserva rutas, sin repetir', () => {
    const parsed = parseAppearance(
      stored({ menu: { order: ['/cocina', 7, 'cocina', '/cocina', null, '/pedidos', `/${'x'.repeat(200)}`], bottom: 'no' } }),
    )

    expect(parsed.menu).toEqual({ order: ['/cocina', '/pedidos'], bottom: null })
  })

  it('la barra de abajo guardada no pasa de sus lugares', () => {
    const many = ['/a', '/b', '/c', '/d', '/e', '/f']

    expect(parseAppearance(stored({ menu: { order: many, bottom: many } })).menu.bottom).toHaveLength(BOTTOM_BAR_SLOTS)
  })

  it('una lista de rutas desmedida se recorta', () => {
    const huge = Array.from({ length: 500 }, (_unused, index) => `/p${String(index)}`)

    expect(parseAppearance(stored({ menu: { order: huge, bottom: null } })).menu.order.length).toBeLessThanOrEqual(100)
  })
})

describe('migración de lo guardado en la versión 1', () => {
  const legacy = (changes: Record<string, unknown>) => parseAppearance(stored(changes, 1))

  it.each([
    ['terracotta', { mode: 'light', accent: 'terracotta', contrast: 'normal' }],
    ['olive', { mode: 'light', accent: 'olive', contrast: 'normal' }],
    ['slate', { mode: 'light', accent: 'slate', contrast: 'normal' }],
    ['wine', { mode: 'light', accent: 'wine', contrast: 'normal' }],
    ['night', { mode: 'dark', accent: 'terracotta', contrast: 'normal' }],
    ['system', { mode: 'system', accent: 'terracotta', contrast: 'normal' }],
    ['contrast', { mode: 'light', accent: 'terracotta', contrast: 'high' }],
  ])('el tema %s pasa a modo, color y contraste', (theme, expected) => {
    expect(legacy({ theme })).toMatchObject(expected)
  })

  it('conserva la letra, el tamaño del texto y el menú, y pone la densidad de fábrica', () => {
    const migrated = legacy({
      theme: 'wine',
      font: 'atkinson',
      textSize: 'larger',
      menu: { order: ['/cocina'], bottom: ['/cocina'] },
    })

    expect(migrated).toEqual({
      ...DEFAULT_APPEARANCE,
      accent: 'wine',
      font: 'atkinson',
      textSize: 'larger',
      menu: { order: ['/cocina'], bottom: ['/cocina'] },
    })
  })

  it('un tema que ya no existe o un v1 a medias vuelve a lo de fábrica sin perder lo demás', () => {
    expect(legacy({ theme: 'neón', font: 'lexend' })).toEqual({ ...DEFAULT_APPEARANCE, font: 'lexend' })
    expect(legacy({})).toEqual(DEFAULT_APPEARANCE)
  })

  it('un v1 con campos de la v2 (mezcla rara) ignora los nuevos', () => {
    expect(legacy({ theme: 'night', mode: 'light', accent: 'wine' })).toMatchObject({ mode: 'dark', accent: 'terracotta' })
  })

  it('lo migrado se vuelve a guardar en la forma nueva', () => {
    const rewritten: unknown = JSON.parse(serializeAppearance(legacy({ theme: 'night' })))

    expect(rewritten).toMatchObject({ version: 2, mode: 'dark', accent: 'terracotta', contrast: 'normal' })
    expect(rewritten).not.toHaveProperty('theme')
  })
})

describe('resolveTheme', () => {
  const plain = { contrast: 'normal' } as const

  it('claro y oscuro eligen la variante del color elegido, sin importar el dispositivo', () => {
    expect(resolveTheme({ ...plain, mode: 'light', accent: 'olive' }, true)).toBe('olive')
    expect(resolveTheme({ ...plain, mode: 'dark', accent: 'olive' }, false)).toBe('olive-dark')
  })

  it('«Automático» sigue el modo del dispositivo y conserva el color elegido', () => {
    expect(resolveTheme({ ...plain, mode: 'system', accent: 'wine' }, true)).toBe('wine-dark')
    expect(resolveTheme({ ...plain, mode: 'system', accent: 'wine' }, false)).toBe('wine')
  })

  it('el alto contraste se combina con el color y respeta el modo', () => {
    expect(resolveTheme({ mode: 'light', accent: 'slate', contrast: 'high' }, false)).toBe('slate-contrast')
    expect(resolveTheme({ mode: 'dark', accent: 'slate', contrast: 'high' }, false)).toBe('slate-contrast-dark')
    expect(resolveTheme({ mode: 'system', accent: 'wine', contrast: 'high' }, true)).toBe('wine-contrast-dark')
    expect(resolveTheme({ mode: 'system', accent: 'wine', contrast: 'high' }, false)).toBe('wine-contrast')
  })

  it('toda combinación de modo y color cae en un tema que existe, con o sin alto contraste', () => {
    const ids = new Set<string>(THEMES.map((theme) => theme.id))
    for (const { id: mode } of MODES) {
      for (const { id: accent } of ACCENTS) {
        expect(ids.has(resolveTheme({ mode, accent, contrast: 'normal' }, true))).toBe(true)
        expect(ids.has(resolveTheme({ mode, accent, contrast: 'high' }, false))).toBe(true)
      }
    }
  })

  it('isDarkMode: «Automático» pregunta al dispositivo y los otros no', () => {
    expect(isDarkMode('system', true)).toBe(true)
    expect(isDarkMode('system', false)).toBe(false)
    expect(isDarkMode('light', true)).toBe(false)
    expect(isDarkMode('dark', false)).toBe(true)
  })
})

describe('stepTextSize', () => {
  it('sube y baja de a un paso y se detiene en los extremos', () => {
    expect(stepTextSize('normal', 1)).toBe('large')
    expect(stepTextSize('larger', 1)).toBe('largest')
    expect(stepTextSize('largest', 1)).toBe('largest')
    expect(stepTextSize('large', -1)).toBe('normal')
    expect(stepTextSize('normal', -1)).toBe('normal')
  })
})

