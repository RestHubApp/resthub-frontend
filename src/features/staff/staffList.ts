import type { QueryClient } from '@tanstack/react-query'

import { rolesQueryKey } from '@/api/roles'
import { MAX_STAFF_PAGE, staffQuery, staffQueryKey } from '@/api/staff'
import type { StaffListResponse, StaffResponse } from '@/api/types'
import { upsertInList } from '@/services/cacheList'

// Un restaurante pequeno tiene pocas cuentas: se piden todas en una pagina
// del servidor y la tabla pagina en el navegador.
const QUERY = { limit: MAX_STAFF_PAGE, ordering: 'full_name' } as const

/** La lista de la pantalla Personal; la misma que se precarga desde el menú. */
export const STAFF_LIST_QUERY = staffQuery(QUERY)

function byName(account: StaffResponse, other: StaffResponse): boolean {
  return account.full_name.localeCompare(other.full_name, 'es') < 0
}

function withAccount(page: StaffListResponse, account: StaffResponse): StaffListResponse {
  const isFresh = !page.items.some((actual) => actual.id === account.id)
  return {
    items: upsertInList(page.items, account, byName, (preview) => preview.full_name === account.full_name),
    total: isFresh ? page.total + 1 : page.total,
  }
}

/**
 * Pone la cuenta como la devolvió el servidor en la lista y relee de fondo
 * las listas de personal (la de esta pantalla y los filtros del historial) y
 * los roles, que cuentan cuántas personas tiene cada uno.
 */
export function saveStaffMember(queryClient: QueryClient, account: StaffResponse): void {
  queryClient.setQueryData(STAFF_LIST_QUERY.queryKey, (page) => page && withAccount(page, account))
  void queryClient.invalidateQueries({ queryKey: staffQueryKey })
  void queryClient.invalidateQueries({ queryKey: rolesQueryKey })
}
