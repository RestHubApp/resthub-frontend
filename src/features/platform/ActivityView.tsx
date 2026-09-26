import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { platformActivityQuery } from '../../api/platform'
import type { PlatformActivityEntry } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import TablePagination from '../../components/TablePagination'
import { formatDateTime } from '../../services/format'
import PlatformQueryError from './PlatformQueryError'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { activityParams, pageCount } from './restaurantList'

const COLUMNAS: DataColumn<PlatformActivityEntry>[] = [
  { id: 'fecha', header: 'Fecha', cell: (e) => formatDateTime(e.created_at, PLATFORM_TIME_ZONE), className: 'whitespace-nowrap' },
  { id: 'quien', header: 'Quién', cell: (e) => e.admin_name },
  { id: 'que', header: 'Qué', cell: (e) => e.kind_label },
  { id: 'detalle', header: 'Detalle', cell: (e) => e.detail, className: 'whitespace-normal break-words' },
]

/**
 * Lo que hizo el equipo de RestHub: accesos, altas y ediciones de
 * restaurantes y encargados agregados. Las horas son las de Lima.
 */
export default function ActivityView() {
  const [pagina, setPagina] = useState(0)
  const bitacora = useQuery({ ...platformActivityQuery(activityParams(pagina)), placeholderData: keepPreviousData })
  const total = bitacora.data?.total ?? 0
  const paginas = pageCount(total)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bitácora" description="Lo que hizo cada administrador del sistema. Horas de Lima." />
      <SectionCard title="Registro" description={bitacora.isSuccess ? `${String(total)} en total` : undefined}>
        {bitacora.isError ? (
          <PlatformQueryError error={bitacora.error} fallback="No se pudo cargar la bitácora." onRetry={() => void bitacora.refetch()} />
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={bitacora.data?.items ?? []}
            isLoading={bitacora.isPending}
            emptyMessage="Todavía no hay nada registrado."
            getRowId={(e) => String(e.id)}
          />
        )}
        {paginas > 1 ? <TablePagination actual={pagina} total={paginas} onChange={setPagina} /> : null}
      </SectionCard>
    </div>
  )
}
