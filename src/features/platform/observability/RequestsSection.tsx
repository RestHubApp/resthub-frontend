import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

import { obsRequestsQuery } from '@/api/observability'
import { SectionCard } from '@/components/SectionCard'
import { RetryQueryError } from '@/components/RetryQueryError'
import { LoadMoreButton } from './LoadMoreButton'
import { type ObsFilters, requestsParams } from './obsFilters'
import { RequestFilters } from './RequestFilters'
import { RequestTable } from './RequestTable'
import type { LiveOptions } from './useObsRefresh'

interface RequestsSectionProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
  readonly live: LiveOptions
}

/** Las peticiones una por una, para ir de un error a su petición y de ahí a sus logs. */
export function RequestsSection({ filters, onChange, live }: RequestsSectionProps) {
  const requests = useInfiniteQuery({ ...obsRequestsQuery(requestsParams(filters)), ...live, placeholderData: keepPreviousData })
  const rows = requests.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div id="peticiones" tabIndex={-1} className="scroll-mt-4 outline-none">
      <SectionCard title="Peticiones" description="Las más nuevas primero, con su duración y su tiempo de base. Horas de Lima.">
        <RequestFilters filters={filters} onChange={onChange} />
        {requests.isError ? (
          <RetryQueryError
            error={requests.error}
            fallback="No se pudieron cargar las peticiones."
            onRetry={() => void requests.refetch()}
          />
        ) : (
          <div aria-busy={requests.isPlaceholderData} className={`flex flex-col gap-3 ${requests.isPlaceholderData ? 'opacity-60' : ''}`}>
            <RequestTable entries={rows} isLoading={requests.isPending} filters={filters} />
            {requests.isSuccess ? (
              <LoadMoreButton
                shown={rows.length}
                noun={rows.length === 1 ? 'petición' : 'peticiones'}
                hasMore={requests.hasNextPage}
                loading={requests.isFetchingNextPage}
                onLoad={() => void requests.fetchNextPage()}
              />
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
