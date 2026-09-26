import { MAX_STAFF_PAGE, staffQuery } from '../../api/staff'

// Un restaurante pequeno tiene pocas cuentas: se piden todas en una pagina
// del servidor y la tabla pagina en el navegador.
const CONSULTA = { limit: MAX_STAFF_PAGE, ordering: 'full_name' } as const

/** La lista de la pantalla Personal; la misma que se precarga desde el menú. */
export const STAFF_LIST_QUERY = staffQuery(CONSULTA)
