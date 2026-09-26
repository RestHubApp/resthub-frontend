import type { QueryClient } from '@tanstack/react-query'

import { MAX_STAFF_PAGE, staffQuery, staffQueryKey } from '../../api/staff'
import type { StaffListResponse, StaffResponse } from '../../api/types'
import { upsertInList } from '../../services/cacheList'

// Un restaurante pequeno tiene pocas cuentas: se piden todas en una pagina
// del servidor y la tabla pagina en el navegador.
const CONSULTA = { limit: MAX_STAFF_PAGE, ordering: 'full_name' } as const

/** La lista de la pantalla Personal; la misma que se precarga desde el menú. */
export const STAFF_LIST_QUERY = staffQuery(CONSULTA)

function porNombre(cuenta: StaffResponse, otra: StaffResponse): boolean {
  return cuenta.full_name.localeCompare(otra.full_name, 'es') < 0
}

function conCuenta(pagina: StaffListResponse, cuenta: StaffResponse): StaffListResponse {
  const nueva = !pagina.items.some((actual) => actual.id === cuenta.id)
  return {
    items: upsertInList(pagina.items, cuenta, porNombre, (previa) => previa.full_name === cuenta.full_name),
    total: nueva ? pagina.total + 1 : pagina.total,
  }
}

/**
 * Pone la cuenta como la devolvió el servidor en la lista y relee de fondo
 * las listas de personal (la de esta pantalla y los filtros del historial).
 */
export function saveStaffMember(queryClient: QueryClient, cuenta: StaffResponse): void {
  queryClient.setQueryData(STAFF_LIST_QUERY.queryKey, (pagina) => pagina && conCuenta(pagina, cuenta))
  void queryClient.invalidateQueries({ queryKey: staffQueryKey })
}
