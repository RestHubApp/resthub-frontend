import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

import { obsLogsQuery } from '../../../api/observability'
import SectionCard from '../../../components/SectionCard'
import PlatformQueryError from '../PlatformQueryError'
import LoadMoreButton from './LoadMoreButton'
import LogFilters from './LogFilters'
import LogTable from './LogTable'
import { logsParams, type ObsFilters } from './obsFilters'
import type { LiveOptions } from './useObsRefresh'

interface LogsSectionProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
  readonly live: LiveOptions
}

/** Advertencias y errores que guardó el backend, con su detalle y su traceback. */
export default function LogsSection({ filters, onChange, live }: LogsSectionProps) {
  const logs = useInfiniteQuery({ ...obsLogsQuery(logsParams(filters)), ...live, placeholderData: keepPreviousData })
  const entradas = logs.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div id="logs" tabIndex={-1} className="scroll-mt-4 outline-none">
      <SectionCard title="Logs" description="Advertencias y errores, los más nuevos primero. Horas de Lima.">
        <LogFilters filters={filters} onChange={onChange} />
        {logs.isError ? (
          <PlatformQueryError error={logs.error} fallback="No se pudieron cargar los logs." onRetry={() => void logs.refetch()} />
        ) : (
          <div aria-busy={logs.isPlaceholderData} className={`flex flex-col gap-3 ${logs.isPlaceholderData ? 'opacity-60' : ''}`}>
            <LogTable entries={entradas} isLoading={logs.isPending} filters={filters} />
            {logs.isSuccess ? (
              <LoadMoreButton
                shown={entradas.length}
                noun={entradas.length === 1 ? 'entrada' : 'entradas'}
                hasMore={logs.hasNextPage}
                loading={logs.isFetchingNextPage}
                onLoad={() => void logs.fetchNextPage()}
              />
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
