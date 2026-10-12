import type { DishMargin } from '@/api/types'

/** Cuántos platos de cada extremo se muestran en la pantalla; el resto va en la hoja con la tabla completa. */
export const HIGHLIGHTED = 5

function percentOf(dish: DishMargin): number {
  return Number(dish.margin_percent)
}

/**
 * Los platos que se ven sin abrir nada: los cinco de mejor margen y los cinco
 * de peor margen. Con diez platos o menos se ven todos; los que no tienen
 * receta no tienen margen y solo salen en la tabla completa.
 */
export function marginHighlights(dishes: readonly DishMargin[]): readonly DishMargin[] {
  if (dishes.length <= HIGHLIGHTED * 2) {
    return dishes
  }
  const ranked = dishes.filter((dish) => dish.margin_percent !== null).toSorted((a, b) => percentOf(b) - percentOf(a))
  const shown = new Set([...ranked.slice(0, HIGHLIGHTED), ...ranked.slice(-HIGHLIGHTED)])
  return ranked.filter((dish) => shown.has(dish))
}
