import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

import { obsRequestsQuery } from '../../../api/observability'
import SectionCard from '../../../components/SectionCard'
import PlatformQueryError from '../PlatformQueryError'
import LoadMoreButton from './LoadMoreButton'
import { type ObsFilters, requestsParams } from './obsFilters'
import RequestFilters from './RequestFilters'
import RequestTable from './RequestTable'
import type { LiveOptions } from './useObsRefresh'

interface RequestsSectionProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
  readonly live: LiveOptions
}

/** Las peticiones una por una, para ir de un error a su petición y de ahí a sus logs. */
export default function RequestsSection({ filters, onChange, live }: RequestsSectionProps) {
  const peticiones = useInfiniteQuery({ ...obsRequestsQuery(requestsParams(filters)), ...live, placeholderData: keepPreviousData })
  const filas = peticiones.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div id="peticiones" tabIndex={-1} className="scroll-mt-4 outline-none">
      <SectionCard title="Peticiones" description="Las más nuevas primero, con su duración y su tiempo de base. Horas de Lima.">
        <RequestFilters filters={filters} onChange={onChange} />
        {peticiones.isError ? (
          <PlatformQueryError
            error={peticiones.error}
            fallback="No se pudieron cargar las peticiones."
            onRetry={() => void peticiones.refetch()}
          />
        ) : (
          <div aria-busy={peticiones.isPlaceholderData} className={`flex flex-col gap-3 ${peticiones.isPlaceholderData ? 'opacity-60' : ''}`}>
            <RequestTable entries={filas} isLoading={peticiones.isPending} filters={filters} />
            {peticiones.isSuccess ? (
              <LoadMoreButton
                shown={filas.length}
                noun={filas.length === 1 ? 'petición' : 'peticiones'}
                hasMore={peticiones.hasNextPage}
                loading={peticiones.isFetchingNextPage}
                onLoad={() => void peticiones.fetchNextPage()}
              />
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
