import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { obsSearch, type ObsFilters, parseObsFilters } from './obsFilters'

/**
 * Los filtros del panel, leídos de la dirección.
 *
 * Cambiar un filtro reemplaza la entrada del historial en vez de apilarla: ir
 * atrás vuelve a donde se estaba antes del panel, no a cada letra escrita.
 * Los enlaces entre logs y peticiones sí apilan, porque son navegar.
 */
export function useObsFilters() {
  const [search, setSearch] = useSearchParams()
  const filters = useMemo(() => parseObsFilters(search), [search])
  const update = useCallback(
    (patch: Partial<ObsFilters>) => {
      setSearch(obsSearch({ ...filters, ...patch }), { replace: true, preventScrollReset: true })
    },
    [filters, setSearch],
  )
  return { filters, update }
}
