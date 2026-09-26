import type { MenuCategory, MenuItem, MenuResponse, MenuSection } from '../../api/types'
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
    categories: menu.categories.map((categoria) => ({
      ...categoria,
      items: categoria.items.map((plato) => (plato.id === itemId ? { ...plato, ...patch } : plato)),
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
    categories: menu.categories.map((categoria) =>
      categoria.id === categoryId
        ? { ...categoria, items: sortByIds(categoria.items, ids) }
        : categoria,
    ),
  }
}

function conPlato(categoria: MenuSection, plato: MenuItem): MenuSection {
  const estaba = categoria.items.some((actual) => actual.id === plato.id)
  if (categoria.id !== plato.category_id) {
    return estaba ? { ...categoria, items: categoria.items.filter((actual) => actual.id !== plato.id) } : categoria
  }
  if (estaba) {
    return { ...categoria, items: categoria.items.map((actual) => (actual.id === plato.id ? plato : actual)) }
  }
  // Un plato nuevo, o que llega de otra categoría, queda al final de la suya.
  return { ...categoria, items: [...categoria.items, plato] }
}

/** La carta con un plato creado o editado, tal como lo devolvió el servidor. */
export function withItem(menu: MenuResponse, item: MenuItem): MenuResponse {
  return { categories: menu.categories.map((categoria) => conPlato(categoria, item)) }
}

/** La carta con una categoría creada (al final y sin platos) o renombrada. */
export function withCategory(menu: MenuResponse, category: MenuCategory): MenuResponse {
  const estaba = menu.categories.some((actual) => actual.id === category.id)
  return {
    categories: estaba
      ? menu.categories.map((actual) => (actual.id === category.id ? { ...actual, ...category } : actual))
      : [...menu.categories, { ...category, items: [] }],
  }
}

export function withoutCategory(menu: MenuResponse, categoryId: number): MenuResponse {
  return { categories: menu.categories.filter((categoria) => categoria.id !== categoryId) }
}
