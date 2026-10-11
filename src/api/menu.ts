import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type {
  CreateCategoryRequest,
  CreateMenuItemRequest,
  MenuCategory,
  MenuItem,
  MenuResponse,
  UpdateCategoryRequest,
  UpdateMenuItemRequest,
} from './types'

// La carta del restaurante: la lee el personal completo y la edita el encargado.

export const menuQueryKey = ['menu'] as const

function menuListQueryKey(includeInactive: boolean) {
  return [...menuQueryKey, { includeInactive }] as const
}

/** Con `includeInactive`, también lo desactivado: solo lo pide quien administra el menú. */
async function fetchMenu(includeInactive = false): Promise<MenuResponse> {
  return send((client) =>
    client.GET('/api/v1/menu', { params: { query: includeInactive ? { include_inactive: true } : {} } }),
  )
}

export function menuQuery(includeInactive: boolean) {
  return queryOptions({
    queryKey: menuListQueryKey(includeInactive),
    queryFn: () => fetchMenu(includeInactive),
  })
}

export async function createCategory(payload: CreateCategoryRequest): Promise<MenuCategory> {
  return send((client) => client.POST('/api/v1/menu/categories', { body: payload }))
}

export async function updateCategory(
  categoryId: number,
  payload: UpdateCategoryRequest,
): Promise<MenuCategory> {
  return send((client) =>
    client.PATCH('/api/v1/menu/categories/{category_id}', {
      params: { path: { category_id: categoryId } },
      body: payload,
    }),
  )
}

/** Solo una categoría vacía: con platos, el servidor responde 409. */
export async function deleteCategory(categoryId: number): Promise<void> {
  await send((client) =>
    client.DELETE('/api/v1/menu/categories/{category_id}', { params: { path: { category_id: categoryId } } }),
  )
}

/** Todas las categorías, en el orden nuevo. */
export async function reorderCategories(ids: readonly number[]): Promise<MenuCategory[]> {
  return send((client) => client.PUT('/api/v1/menu/categories/order', { body: { ids: [...ids] } }))
}

/** Todos los platos de la categoría, en el orden nuevo. */
export async function reorderItems(
  categoryId: number,
  ids: readonly number[],
): Promise<MenuItem[]> {
  return send((client) =>
    client.PUT('/api/v1/menu/categories/{category_id}/items/order', {
      params: { path: { category_id: categoryId } },
      body: { ids: [...ids] },
    }),
  )
}

export async function createMenuItem(payload: CreateMenuItemRequest): Promise<MenuItem> {
  return send((client) => client.POST('/api/v1/menu/items', { body: payload }))
}

export async function updateMenuItem(
  itemId: number,
  payload: UpdateMenuItemRequest,
): Promise<MenuItem> {
  return send((client) =>
    client.PATCH('/api/v1/menu/items/{item_id}', { params: { path: { item_id: itemId } }, body: payload }),
  )
}

/** "Hoy no hay ceviche": el plato sigue en la carta, pero no se puede pedir. */
export async function setAvailability(itemId: number, isAvailable: boolean): Promise<MenuItem> {
  return send((client) =>
    client.PATCH('/api/v1/menu/items/{item_id}/availability', {
      params: { path: { item_id: itemId } },
      body: { is_available: isAvailable },
    }),
  )
}
