import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { obsSummaryQuery } from '../../../api/observability'
import type { ObsWindowParams } from '../../../api/types'
import ObsQueryState from './ObsQueryState'
import SampledNotice from './SampledNotice'
import SummaryTiles from './SummaryTiles'
import type { LiveOptions } from './useObsRefresh'

interface SummarySectionProps {
  readonly params: ObsWindowParams
  readonly live: LiveOptions
}

/** Los indicadores de la ventana: tráfico, errores, latencias y base. */
export default function SummarySection({ params, live }: SummarySectionProps) {
  const resumen = useQuery({ ...obsSummaryQuery(params), ...live, placeholderData: keepPreviousData })

  return (
    <ObsQueryState query={resumen} errorText="No se pudo cargar el resumen." loadingLabel="Cargando el resumen…" skeletonClassName="h-28 rounded-xl">
      {(summary) => (
        <section aria-label="Indicadores de la ventana" aria-busy={resumen.isPlaceholderData} className="flex flex-col gap-3">
          <SummaryTiles summary={summary} />
          {summary.sampled ? (
            <SampledNotice>
              La ventana pasa de 200 000 peticiones: los percentiles salen de una muestra pareja, no de todas.
            </SampledNotice>
          ) : null}
        </section>
      )}
    </ObsQueryState>
  )
}
