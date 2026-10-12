import { describe, expect, it } from '@jest/globals'

import type { DishMargin } from '@/api/types'
import { marginHighlights } from './marginHighlights'

function dish(id: number, percent: string | null): DishMargin {
  return {
    menu_item_id: id,
    name: `Plato ${String(id)}`,
    category: 'Fondos',
    price: '30.00',
    recipe_cost: percent === null ? null : '10.00',
    estimated_cost: percent === null ? null : '10.00',
    revenue: '30.00',
    unit_margin: percent === null ? null : '20.00',
    margin_percent: percent,
    quantity_sold: 1,
    gross_margin: percent === null ? null : '20.00',
  }
}

describe('marginHighlights', () => {
  it('con diez platos o menos los deja todos', () => {
    const dishes = Array.from({ length: 10 }, (_, index) => dish(index, String(index * 5)))
    expect(marginHighlights(dishes)).toHaveLength(10)
  })

  it('con más de diez deja los cinco mejores y los cinco peores por margen, de mayor a menor', () => {
    const dishes = Array.from({ length: 20 }, (_, index) => dish(index, String(index * 3)))
    const shown = marginHighlights(dishes).map((item) => item.menu_item_id)

    expect(shown).toEqual([19, 18, 17, 16, 15, 4, 3, 2, 1, 0])
  })

  it('los platos sin receta no tienen margen y quedan fuera del resumen', () => {
    const dishes = [...Array.from({ length: 12 }, (_, index) => dish(index, String(index))), dish(99, null)]
    expect(marginHighlights(dishes).some((item) => item.menu_item_id === 99)).toBe(false)
  })
})
