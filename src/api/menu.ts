import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
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

export function menuListQueryKey(includeInactive: boolean) {
  return [...menuQueryKey, { includeInactive }] as const
}

/** Con `includeInactive`, también lo desactivado: solo lo pide quien administra el menú. */
export async function fetchMenu(includeInactive = false): Promise<MenuResponse> {
  const { data } = await api.get<MenuResponse>('/menu', {
    params: includeInactive ? { include_inactive: true } : undefined,
  })
  return data
}

export function menuQuery(includeInactive: boolean) {
  return queryOptions({
    queryKey: menuListQueryKey(includeInactive),
    queryFn: () => fetchMenu(includeInactive),
  })
}

function categoryPath(categoryId: number, action = ''): string {
  return `/menu/categories/${String(categoryId)}${action}`
}

function itemPath(itemId: number, action = ''): string {
  return `/menu/items/${String(itemId)}${action}`
}

export async function createCategory(payload: CreateCategoryRequest): Promise<MenuCategory> {
  const { data } = await api.post<MenuCategory>('/menu/categories', payload)
  return data
}

export async function updateCategory(
  categoryId: number,
  payload: UpdateCategoryRequest,
): Promise<MenuCategory> {
  const { data } = await api.patch<MenuCategory>(categoryPath(categoryId), payload)
  return data
}

/** Solo una categoría vacía: con platos, el servidor responde 409. */
export async function deleteCategory(categoryId: number): Promise<void> {
  await api.delete(categoryPath(categoryId))
}

/** Todas las categorías, en el orden nuevo. */
export async function reorderCategories(ids: readonly number[]): Promise<MenuCategory[]> {
  const { data } = await api.put<MenuCategory[]>('/menu/categories/order', { ids })
  return data
}

/** Todos los platos de la categoría, en el orden nuevo. */
export async function reorderItems(
  categoryId: number,
  ids: readonly number[],
): Promise<MenuItem[]> {
  const { data } = await api.put<MenuItem[]>(categoryPath(categoryId, '/items/order'), { ids })
  return data
}

export async function createMenuItem(payload: CreateMenuItemRequest): Promise<MenuItem> {
  const { data } = await api.post<MenuItem>('/menu/items', payload)
  return data
}

export async function updateMenuItem(
  itemId: number,
  payload: UpdateMenuItemRequest,
): Promise<MenuItem> {
  const { data } = await api.patch<MenuItem>(itemPath(itemId), payload)
  return data
}

/** "Hoy no hay ceviche": el plato sigue en la carta, pero no se puede pedir. */
export async function setAvailability(itemId: number, isAvailable: boolean): Promise<MenuItem> {
  const { data } = await api.patch<MenuItem>(itemPath(itemId, '/availability'), {
    is_available: isAvailable,
  })
  return data
}
