import type { MenuItem, MenuResponse } from '../../api/types'
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
