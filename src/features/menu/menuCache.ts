import type { MenuCategory, MenuItem, MenuResponse, MenuSection } from '@/api/types'
import { sortByIds } from './menuOrder'

// Cambios sobre la carta guardada en caché, para que la pantalla responda al
// toque y no después del viaje al servidor. Si el servidor rechaza el cambio,
// quien llama restaura la copia anterior.

export function patchItem(
  menu: MenuResponse,
  itemId: number,
  patch: Partial<MenuItem>,
): MenuResponse {
  return {
    categories: menu.categories.map((category) => ({
      ...category,
      items: category.items.map((dish) => (dish.id === itemId ? { ...dish, ...patch } : dish)),
    })),
  }
}

export function withCategoryOrder(menu: MenuResponse, ids: readonly number[]): MenuResponse {
  return { categories: sortByIds(menu.categories, ids) }
}

export function withItemOrder(
  menu: MenuResponse,
  categoryId: number,
  ids: readonly number[],
): MenuResponse {
  return {
    categories: menu.categories.map((category) =>
      category.id === categoryId
        ? { ...category, items: sortByIds(category.items, ids) }
        : category,
    ),
  }
}

function withDish(category: MenuSection, dish: MenuItem): MenuSection {
  const was = category.items.some((actual) => actual.id === dish.id)
  if (category.id !== dish.category_id) {
    return was ? { ...category, items: category.items.filter((actual) => actual.id !== dish.id) } : category
  }
  if (was) {
    return { ...category, items: category.items.map((actual) => (actual.id === dish.id ? dish : actual)) }
  }
  // Un plato nuevo, o que llega de otra categoría, queda al final de la suya.
  return { ...category, items: [...category.items, dish] }
}

/** La carta con un plato creado o editado, tal como lo devolvió el servidor. */
export function withItem(menu: MenuResponse, item: MenuItem): MenuResponse {
  return { categories: menu.categories.map((category) => withDish(category, item)) }
}

/** La carta con una categoría creada (al final y sin platos) o renombrada. */
export function withCategory(menu: MenuResponse, category: MenuCategory): MenuResponse {
  const was = menu.categories.some((actual) => actual.id === category.id)
  return {
    categories: was
      ? menu.categories.map((actual) => (actual.id === category.id ? { ...actual, ...category } : actual))
      : [...menu.categories, { ...category, items: [] }],
  }
}

export function withoutCategory(menu: MenuResponse, categoryId: number): MenuResponse {
  return { categories: menu.categories.filter((category) => category.id !== categoryId) }
}
