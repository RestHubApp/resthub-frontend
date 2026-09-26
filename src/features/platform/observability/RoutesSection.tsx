import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { obsRoutesQuery } from '../../../api/observability'
import type { ObsRouteSort } from '../../../api/types'
import EmptyState from '../../../components/EmptyState'
import SectionCard from '../../../components/SectionCard'
import { type ObsFilters, windowParams } from './obsFilters'
import ObsQueryState from './ObsQueryState'
import { DEFAULT_ROUTE_SORT, ROUTES_LIMIT, sortRoutes } from './routeSort'
import RoutesTable from './RoutesTable'
import SampledNotice from './SampledNotice'
import type { LiveOptions } from './useObsRefresh'

interface RoutesSectionProps {
  readonly filters: ObsFilters
  readonly live: LiveOptions
}

/**
 * Las 20 rutas con más peticiones, más lentas o con más errores.
 *
 * Al cambiar de orden, lo que se ve se reordena al instante mientras llegan
 * las 20 de la columna nueva, que pueden ser otras rutas.
 */
export default function RoutesSection({ filters, live }: RoutesSectionProps) {
  const [sort, setSort] = useState<ObsRouteSort>(DEFAULT_ROUTE_SORT)
  const rutas = useQuery({
    ...obsRoutesQuery({ ...windowParams(filters), sort, limit: ROUTES_LIMIT }),
    ...live,
    placeholderData: keepPreviousData,
  })

  return (
    <SectionCard
      title="Rutas"
      description={`Las ${String(ROUTES_LIMIT)} primeras por la columna elegida. Cada ruta lleva a sus peticiones.`}
    >
      <ObsQueryState query={rutas} errorText="No se pudieron cargar las rutas." loadingLabel="Cargando las rutas…" skeletonClassName="h-72 rounded-xl">
        {(data) =>
          data.length === 0 ? (
            <EmptyState title="No hubo peticiones en esta ventana." />
          ) : (
            <div aria-busy={rutas.isPlaceholderData} className={`flex flex-col gap-3 transition-opacity ${rutas.isPlaceholderData ? 'opacity-60' : ''}`}>
              <RoutesTable routes={sortRoutes(data, sort)} sort={sort} onSort={setSort} filters={filters} />
              {data.some((route) => route.sampled) ? (
                <SampledNotice>Los percentiles marcados con ≈ salen de una muestra de sus peticiones.</SampledNotice>
              ) : null}
            </div>
          )
        }
      </ObsQueryState>
    </SectionCard>
  )
}
