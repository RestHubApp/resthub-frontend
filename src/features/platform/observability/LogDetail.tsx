import { useQuery } from '@tanstack/react-query'

import { obsLogQuery } from '../../../api/observability'
import type { ObsFilters } from './obsFilters'
import LogDetailBody from './LogDetailBody'
import ObsQueryState from './ObsQueryState'

interface LogDetailProps {
  readonly entryId: number
  readonly filters: ObsFilters
}

/** El detalle de un log, que se pide recién al abrirlo. Una entrada guardada no cambia: no se relee sola. */
export default function LogDetail({ entryId, filters }: LogDetailProps) {
  const detalle = useQuery({ ...obsLogQuery(entryId), staleTime: Infinity })
  return (
    <ObsQueryState query={detalle} errorText="No se pudo cargar la entrada." loadingLabel="Cargando la entrada…" skeletonClassName="h-40 rounded-lg">
      {(entry) => <LogDetailBody entry={entry} filters={filters} />}
    </ObsQueryState>
  )
}
