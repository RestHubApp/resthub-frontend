import { describe, expect, it } from '@jest/globals'

import { dish } from '#jest/fixtures/orders'
import { summarize, toggle } from './modifierSelection'

const SIZE = {
  name: 'Size',
  min_choices: 1,
  max_choices: 1,
  options: [
    { name: 'Vaso', price: '0.00' },
    { name: 'Jarra', price: '5.00' },
  ],
}
const EXTRAS = {
  name: 'Extras',
  min_choices: 0,
  max_choices: 2,
  options: [
    { name: 'Hielo', price: '1.00' },
    { name: 'Limón', price: '2.00' },
    { name: 'Menta', price: '3.00' },
  ],
}

describe('toggle', () => {
  it('con máximo uno elegir otra opción reemplaza la anterior', () => {
    const first = toggle({ selected: {}, group: 'Size', option: 'Vaso', max: 1 })

    expect(toggle({ selected: first, group: 'Size', option: 'Jarra', max: 1 })).toEqual({ Size: ['Jarra'] })
  })

  it('tocar una opción elegida la quita', () => {
    expect(toggle({ selected: { Extras: ['Hielo'] }, group: 'Extras', option: 'Hielo', max: 2 })).toEqual({ Extras: [] })
  })

  it('con varios máximos conserva solo las últimas elegidas', () => {
    const selected = { Extras: ['Hielo', 'Limón'] }

    expect(toggle({ selected, group: 'Extras', option: 'Menta', max: 2 })).toEqual({ Extras: ['Limón', 'Menta'] })
  })
})

describe('summarize', () => {
  const item = dish({ price: '8.00', modifier_groups: [SIZE, EXTRAS] })

  it('señala el grupo obligatorio sin elegir', () => {
    const summary = summarize(item, {})

    expect(summary.missing.map((group) => group.name)).toEqual(['Size'])
    expect(summary.totalCents).toBe(800)
  })

  it('suma al precio base lo elegido', () => {
    const summary = summarize(item, { Size: ['Jarra'], Extras: ['Hielo'] })

    expect(summary.missing).toEqual([])
    expect(summary.modifiers).toEqual([
      { group: 'Size', option: 'Jarra', price: '5.00' },
      { group: 'Extras', option: 'Hielo', price: '1.00' },
    ])
    expect(summary.totalCents).toBe(1400)
  })
})
