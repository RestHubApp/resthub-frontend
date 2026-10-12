import { describe, expect, it } from '@jest/globals'

import {
  APPEARANCE_VERSION,
  type Appearance,
  BOTTOM_BAR_SLOTS,
  DEFAULT_APPEARANCE,
  parseAppearance,
  resolveTheme,
  serializeAppearance,
} from './appearanceRules'

function stored(changes: Record<string, unknown>): string {
  return JSON.stringify({ version: APPEARANCE_VERSION, ...changes })
}

describe('parseAppearance', () => {
  it('sin nada guardado da las preferencias de fábrica', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE)
  })

  it('un JSON roto, un valor que no es objeto o una versión distinta dan las de fábrica', () => {
    expect(parseAppearance('{no es json')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('"tema"')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('[1, 2]')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('null')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance(JSON.stringify({ version: 99, theme: 'night' }))).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance(JSON.stringify({ theme: 'night' }))).toEqual(DEFAULT_APPEARANCE)
  })

  it('lee lo que ella misma guardó', () => {
    const appearance: Appearance = {
      theme: 'wine',
      font: 'lexend',
      textSize: 'larger',
      menu: { order: ['/cocina', '/pedidos'], bottom: ['/cocina'] },
    }

    expect(parseAppearance(serializeAppearance(appearance))).toEqual(appearance)
  })

  it('cada preferencia inválida vuelve a la de fábrica sin tirar las demás', () => {
    const parsed = parseAppearance(stored({ theme: 'neón', font: 'lexend', textSize: 99, menu: 'raro' }))

    expect(parsed).toEqual({ ...DEFAULT_APPEARANCE, font: 'lexend' })
  })

  it('acepta «Según el sistema»', () => {
    expect(parseAppearance(stored({ theme: 'system' })).theme).toBe('system')
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

describe('resolveTheme', () => {
  it('un tema elegido se pinta tal cual, sea cual sea el modo del aparato', () => {
    expect(resolveTheme('olive', true)).toBe('olive')
    expect(resolveTheme('night', false)).toBe('night')
  })

  it('«Según el sistema» elige Noche si el aparato está en oscuro y Terracota si no', () => {
    expect(resolveTheme('system', true)).toBe('night')
    expect(resolveTheme('system', false)).toBe('terracotta')
  })
})
