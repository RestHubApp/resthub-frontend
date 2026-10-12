import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { platformActivityQuery } from '@/api/platform'
import type { PlatformActivityEntry } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { formatDateTime } from '@/services/format'
import { RetryQueryError } from '@/components/RetryQueryError'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { activityParams, pageCount } from './restaurantList'

const COLUMNS: DataColumn<PlatformActivityEntry>[] = [
  { id: 'fecha', header: 'Fecha', cell: (e) => formatDateTime(e.created_at, PLATFORM_TIME_ZONE), className: 'whitespace-nowrap' },
  { id: 'quien', header: 'Quién', cell: (e) => e.admin_name },
  { id: 'que', header: 'Qué', cell: (e) => e.kind_label },
  { id: 'detalle', header: 'Detalle', cell: (e) => e.detail, className: 'whitespace-normal break-words' },
]

/**
 * Lo que hizo el equipo de RestHub: accesos, altas y ediciones de
 * restaurantes y encargados agregados. Las horas son las de Lima.
 */
export function ActivityView() {
  const [page, setPage] = useState(0)
  const log = useQuery({ ...platformActivityQuery(activityParams(page)), placeholderData: keepPreviousData })
  const total = log.data?.total ?? 0
  const pages = pageCount(total)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bitácora" description="Lo que hizo cada administrador del sistema. Horas de Lima." />
      <SectionCard title="Registro" description={log.isSuccess ? `${String(total)} en total` : undefined}>
        {log.isError ? (
          <RetryQueryError error={log.error} fallback="No se pudo cargar la bitácora." onRetry={() => void log.refetch()} />
        ) : (
          <DataTable
            label="Bitácora de plataforma"
            columns={COLUMNS}
            data={log.data?.items ?? []}
            isLoading={log.isPending}
            emptyMessage="Todavía no hay nada registrado."
            getRowId={(e) => String(e.id)}
          />
        )}
        {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
      </SectionCard>
    </div>
  )
}
