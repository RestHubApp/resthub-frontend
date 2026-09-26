import { PLATFORM_PAGE_SIZE } from '../../api/platform'
import type { PlatformActivityParams, PlatformRestaurantListParams } from '../../api/types'

/** El largo máximo de la búsqueda que acepta el backend. */
export const MAX_RESTAURANT_SEARCH = 120

/** Una página del servidor, desde cero. Sin texto de búsqueda no se manda el filtro. */
export function restaurantListParams(search: string, page: number): PlatformRestaurantListParams {
  const texto = search.trim()
  const pagina = { limit: PLATFORM_PAGE_SIZE, offset: page * PLATFORM_PAGE_SIZE }
  return texto === '' ? pagina : { ...pagina, search: texto }
}

export function activityParams(page: number): PlatformActivityParams {
  return { limit: PLATFORM_PAGE_SIZE, offset: page * PLATFORM_PAGE_SIZE }
}

/** Cuántas páginas hay; al menos una, aunque la lista esté vacía. */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PLATFORM_PAGE_SIZE))
}

/** «3 de 4 activas»: el personal del restaurante y cuántas cuentas pueden entrar. */
export function staffSummary(activeCount: number, total: number): string {
  if (total === 0) {
    return 'Sin cuentas'
  }
  return `${String(activeCount)} de ${String(total)} ${total === 1 ? 'activa' : 'activas'}`
}
